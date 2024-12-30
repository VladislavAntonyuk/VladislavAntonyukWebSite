Merry Christmas! 🎄🎅🎁

When working with large data sets, exporting data to Excel files often becomes challenging due to memory constraints. Recently, I undertook the task of optimizing memory consumption for this operation and successfully reduced the memory usage from over **50,000 MB** to less than **500 KB**. This article outlines the approach, the key improvements I implemented, benchmark results to support these claims, and the solution's limitations.

## Libraries Used Initially

1. **OpenXML SDK**

	OpenXml is a popular cross-platform library for creating and editing Excel files programmatically.

	My initial code looked like this.

	First of all, let's install the OpenXML NuGet package:

	```xml
	<PackageReference Include="DocumentFormat.OpenXml" Version="3.2.0" />
	```

	The usage of OpenXML SDK for exporting data to Excel is shown below:

	```csharp
	internal class OpenXmlService
	{
		public static void Save(Stream stream, IEnumerable<IEnumerable<string>> rows)
		{
			using var document = SpreadsheetDocument.Create(stream, SpreadsheetDocumentType.Workbook);
			var wbPart = document.AddWorkbookPart();
			wbPart.Workbook = new Workbook();
			var part = wbPart.AddNewPart<WorksheetPart>();
			var sheetData = new SheetData();
			part.Worksheet = new Worksheet(sheetData);
			wbPart.Workbook.AppendChild(
				new Sheets(
					new Sheet
					{
						Id = wbPart.GetIdOfPart(part),
						SheetId = 1,
						Name = "SheetName",
					}));

			foreach (var value in rows)
			{
				var dataRow = sheetData.AppendChild(new Row());
				foreach (var dataElement in value)
				{
					dataRow.Append(ConstructCell(dataElement, CellValues.String));
				}
			}

			wbPart.Workbook.Save();
		}

		private static Cell ConstructCell(string value, CellValues dataTypes) => new() { CellValue = new CellValue(value), DataType = new EnumValue<CellValues>(dataTypes) };
	}
	```

	While powerful and flexible, it allocates memory for each cell into memory, leading to high memory consumption for large datasets.

2. **Other XLSX Libraries**

	Additional libraries such as `MiniExcel` and `ClosedXML` were tested to save models into XLSX format. Still, similar memory inefficiencies were observed, especially for operations requiring extensive formatting or handling large datasets.

## My Solution: A Custom Library

To address this issue, I decided to develop a custom library tailored to the specific needs of the operation. The primary goals were:

1. **Efficient Memory Management:** Avoid unnecessary object creation and keep memory overhead minimal.
2. **Optimized Data Streaming:** This method handles data in small chunks rather than loading the entire dataset into memory.
3. **Direct File Manipulation:** Minimize intermediate processing by directly interacting with the file structure.

### Excel File Structure

Before looking at the code changes, let's understand the Excel file structure. An Excel file is essentially a **ZIP archive** containing various XML files organized into a specific structure. Key components include:

1. **Workbook:** The container for all sheets in the file.
2. **Worksheets:** Individual sheets containing rows and columns of data.
3. **Shared Strings:** A table for storing reusable text strings to reduce duplication.
4. **Styles:** Definitions for formatting, including fonts, colors, and borders.
5. **Metadata Files:** Files like `[Content_Types].xml` and `app.xml` that store information about the workbook and its structure.

### CustomExcelService

So the custom Excel service has the following code:
```csharp
public static class CustomExcelService
{
	private const string Worksheet = "worksheet";
	private const string WorksheetNameSpace = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
	private const string SheetData = "sheetData";
	private const string Row = "row";
	private const string Cell = "c";
	private const string CellType = "t";
	private const string CellTypeStr = "str";
	private const string Value = "v";

	private const string ContentTypesEntryXml = """
										<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
										<Default Extension="xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml" />
										<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
										<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" />
										</Types>
										""";

	private const string RelsEntryXml = """
										<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
										<Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="/xl/workbook.xml" Id="Re9a0e62ee0d84b49" />
										</Relationships>
										""";

	private const string WorkbookEntryXml = """
											<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
											<sheets><sheet name="Errors" sheetId="1" r:id="SheetId" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" /></sheets>
											</workbook>
											""";

	private const string WorkbookRelsEntryXml = """
												<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
												<Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="/xl/worksheets/sheet1.xml" Id="SheetId" />
												</Relationships>
												""";

	private const string SheetEntryFileName = "xl/worksheets/sheet1.xml";
	private const string ContentTypesEntryFileName = "[Content_Types].xml";
	private const string RelsEntryFileName = "_rels/.rels";
	private const string WorkBookEntryFileName = "xl/workbook.xml";
	private const string WorkbookRelsEntryFileName = "xl/_rels/workbook.xml.rels";

	public static void Save(Stream stream, IEnumerable<IEnumerable<string?>> rows)
	{
		using var zipArchive = new ZipArchive(stream, ZipArchiveMode.Create, true);
		CreateRelatedEntry(zipArchive, ContentTypesEntryFileName, ContentTypesEntryXml);
		CreateRelatedEntry(zipArchive, RelsEntryFileName, RelsEntryXml);
		CreateRelatedEntry(zipArchive, WorkBookEntryFileName, WorkbookEntryXml);
		CreateRelatedEntry(zipArchive, WorkbookRelsEntryFileName, WorkbookRelsEntryXml);

		CreateSheetData(zipArchive, rows);
	}

	private static void CreateSheetData(ZipArchive zipArchive, IEnumerable<IEnumerable<string?>> rows)
	{
		using var sheetStream = zipArchive.CreateEntry(SheetEntryFileName).Open();
		using var writer = XmlWriter.Create(sheetStream);
		writer.WriteStartElement(Worksheet, WorksheetNameSpace);
		writer.WriteStartElement(SheetData);

		foreach (var row in rows)
		{
			WriteRowValues(writer, row);
		}

		writer.WriteEndElement();
		writer.WriteEndElement();
	}

	private static void WriteRowValues(XmlWriter writer, IEnumerable<string?> values)
	{
		writer.WriteStartElement(Row);

		foreach (var value in values)
		{
			WriteCellValue(writer, value);
		}

		writer.WriteEndElement();
	}

	private static void WriteCellValue(XmlWriter writer, string? value)
	{
		writer.WriteStartElement(Cell);
		writer.WriteAttributeString(CellType, CellTypeStr);
		writer.WriteStartElement(Value);

		if (value is not null)
		{
			writer.WriteString(value);
		}

		writer.WriteEndElement();
		writer.WriteEndElement();
	}

	private static void CreateRelatedEntry(ZipArchive zipArchive, string entryName, string xmlData)
	{
		using var xmlStream = zipArchive.CreateEntry(entryName).Open();
		using var writer = XmlWriter.Create(xmlStream);
		writer.WriteRaw(xmlData);
	}
}
```
### Key Improvements

#### 1. **Streaming Data Directly to Disk**
The main bottleneck with existing libraries was their approach of loading the entire dataset into memory before writing to disk. In my custom implementation:

- Data rows are written incrementally to the file, ensuring that memory usage stays consistent regardless of the dataset size.
- This approach is particularly effective for large files as it avoids keeping a full in-memory representation of the file.

#### 2. **Avoiding Unnecessary Formatting**
Many third-party libraries include extensive formatting capabilities by default. While this is convenient, it adds significant memory overhead. My library:

- Strips down formatting operations to only what’s necessary.
- Uses lightweight mechanisms for applying styles, avoiding duplication and excessive data structures.

#### 3. **Efficient Object Handling**
Object creation is expensive in terms of memory. To reduce this overhead:

- I reused objects where possible, such as cell definitions and styles.
- Leveraged pooled memory for repetitive tasks, minimizing garbage collection pressure.

#### 4. **Simplified API**
Focusing on simplicity allowed me to remove unneeded abstractions:

- The API directly maps dataset rows to Excel rows, avoiding complex intermediate transformations.
- This reduced not only memory usage but also the overall execution time.

## Benchmarks

To validate the improvements and ensure accuracy, I used the **Benchmark.NET** library. Below are the results for exporting a dataset:

```
BenchmarkDotNet v0.14.0, Windows 11 (10.0.26100.2605)
11th Gen Intel Core i7-1165G7 2.80GHz, 1 CPU, 8 logical and 4 physical cores
.NET SDK 9.0.200-preview.0.24575.35
 [Host]     : .NET 9.0.0 (9.0.24.52809), X64 RyuJIT AVX-512F+CD+BW+DQ+VL+VBMI
 DefaultJob : .NET 9.0.0 (9.0.24.52809), X64 RyuJIT AVX-512F+CD+BW+DQ+VL+VBMI
```

The benchmark for exporting `IEnumerable<IEnumerable<string>>` (N represents number of columns and rows):

| Method                | N    | Mean         | Error       | StdDev      | Median       | Ratio | RatioSD | Gen0        | Gen1       | Gen2      | Allocated     | Alloc Ratio |
|---------------------- |----- |-------------:|------------:|------------:|-------------:|------:|--------:|------------:|-----------:|----------:|--------------:|------------:|
| RunOpenXmlService     | 10   |     1.736 ms |   0.0647 ms |   0.1898 ms |     1.747 ms |  1.39 |    0.20 |     23.4375 |     3.9063 |         - |     144.66 KB |        3.20 |
| RunClosedXmlService   | 10   |     2.862 ms |   0.0559 ms |   0.0903 ms |     2.868 ms |  2.29 |    0.22 |     78.1250 |    23.4375 |         - |     487.52 KB |       10.78 |
| RunCustomExcelService | 10   |     1.260 ms |   0.0387 ms |   0.1142 ms |     1.260 ms |  1.01 |    0.13 |      5.8594 |     3.9063 |         - |      45.24 KB |        1.00 |
| RunMiniExcelService   | 10   |     8.661 ms |   0.3292 ms |   0.9706 ms |     8.702 ms |  6.93 |    1.00 |   2046.8750 |  2015.6250 | 2000.0000 |   18216.76 KB |      402.69 |
|                       |      |              |             |             |              |       |         |             |            |           |               |             |
| RunOpenXmlService     | 1000 | 2,375.323 ms |  75.0723 ms | 221.3524 ms | 2,347.398 ms |  6.44 |    1.29 |  73000.0000 | 38000.0000 | 3000.0000 |  528389.66 KB |    6,262.69 |
| RunClosedXmlService   | 1000 | 3,229.506 ms | 119.1534 ms | 347.5761 ms | 3,215.195 ms |  8.75 |    1.82 | 157000.0000 |  7000.0000 | 3000.0000 | 1299735.07 KB |   15,404.98 |
| RunCustomExcelService | 1000 |   382.250 ms |  26.5685 ms |  77.0800 ms |   360.150 ms |  1.04 |    0.28 |           - |          - |         - |      84.37 KB |        1.00 |
| RunMiniExcelService   | 1000 | 1,155.879 ms |  71.9980 ms | 201.8902 ms | 1,129.137 ms |  3.13 |    0.78 |  81000.0000 |  5000.0000 | 1000.0000 |  509714.45 KB |    6,041.34 |

The benchmark for exporting `IEnumerable<CustomType>` (N represents number of rows, Columns=10):

| Method                | N     | Mean       | Error      | StdDev      | Median     | Ratio | RatioSD | Gen0       | Gen1      | Gen2      | Allocated   | Alloc Ratio |
|---------------------- |------ |-----------:|-----------:|------------:|-----------:|------:|--------:|-----------:|----------:|----------:|------------:|------------:|
| RunOpenXmlService     | 100   |   4.520 ms |  0.2621 ms |   0.7727 ms |   4.738 ms |  1.71 |    0.31 |    93.7500 |   46.8750 |         - |   639.57 KB |       14.26 |
| RunClosedXmlService   | 100   |  11.297 ms |  0.2786 ms |   0.7721 ms |  11.450 ms |  4.28 |    0.41 |   250.0000 |  125.0000 |         - |  1779.98 KB |       39.69 |
| RunCustomExcelService | 100   |   2.651 ms |  0.0640 ms |   0.1866 ms |   2.610 ms |  1.00 |    0.10 |          - |         - |         - |    44.85 KB |        1.00 |
| RunMiniExcelService   | 100   |   8.700 ms |  0.3912 ms |   1.1535 ms |   8.881 ms |  3.30 |    0.49 |  1859.3750 | 1796.8750 | 1796.8750 | 18451.16 KB |      411.39 |
|                       |       |            |            |             |            |       |         |            |           |           |             |             |
| RunOpenXmlService     | 1000  |  38.818 ms |  0.5216 ms |   0.4879 ms |  38.665 ms |  4.05 |    0.95 |   923.0769 |  615.3846 |  384.6154 |  6172.39 KB |      137.61 |
| RunClosedXmlService   | 1000  |  60.844 ms |  4.1363 ms |  12.1961 ms |  60.364 ms |  6.35 |    1.97 |  2333.3333 | 1333.3333 |  666.6667 |  14444.3 KB |      322.03 |
| RunCustomExcelService | 1000  |   9.922 ms |  0.5068 ms |   1.4458 ms |  10.389 ms |  1.03 |    0.29 |          - |         - |         - |    44.85 KB |        1.00 |
| RunMiniExcelService   | 1000  |  15.503 ms |  1.6068 ms |   4.7378 ms |  13.453 ms |  1.62 |    0.63 |  2312.5000 | 1765.6250 | 1703.1250 | 21805.59 KB |      486.15 |
|                       |       |            |            |             |            |       |         |            |           |           |             |             |
| RunOpenXmlService     | 10000 | 373.718 ms | 38.0834 ms | 112.2899 ms | 335.195 ms |  4.56 |    1.37 |  8666.6667 | 5000.0000 | 1333.3333 | 57846.68 KB |    1,255.46 |
| RunClosedXmlService   | 10000 | 672.539 ms | 23.8740 ms |  70.3930 ms | 700.251 ms |  8.21 |    0.89 | 18000.0000 | 5000.0000 | 3000.0000 | 140001.6 KB |    3,038.48 |
| RunCustomExcelService | 10000 |  82.005 ms |  1.6256 ms |   2.3828 ms |  82.340 ms |  1.00 |    0.04 |          - |         - |         - |    46.08 KB |        1.00 |
| RunMiniExcelService   | 10000 | 128.592 ms |  2.4406 ms |   3.1735 ms | 129.289 ms |  1.57 |    0.06 |  7666.6667 | 1666.6667 | 1666.6667 | 55419.23 KB |    1,202.77 |

The benchmark for exporting `IEnumerable<IEnumerable<string>>` (IterationCount=5, 10_000 columns and 10_000 rows):

| Method                    | Mean      | Error     | StdDev    | Gen0         | Gen1        | Gen2      | Allocated     |
|-------------------------- |----------:|----------:|----------:|-------------:|------------:|----------:|--------------:|
| RunCustomExcelService     |  44.770 s | 40.2934 s | 10.4641 s |            - |           - |         - |     444.42 KB |
| RunMiniExcelService       | 151.494 s | 55.1570 s | 14.3241 s | 8545000.0000 | 183000.0000 | 1000.0000 | 52371165.3 KB |

The benchmark for exporting `IEnumerable<CustomType>` (IterationCount=5, 10 columns, 1_000_000 rows):

| Method                    | Mean      | Error     | StdDev    | Gen0         | Gen1        | Gen2      | Allocated     |
|-------------------------- |----------:|----------:|----------:|-------------:|------------:|----------:|--------------:|
| RunCustomExcelServiceType |   3.464 s |  0.7515 s |  0.1163 s |            - |           - |         - |      53.14 KB |
| RunMiniExcelServiceType   |   4.385 s |  0.8925 s |  0.2318 s |  648000.0000 |           - |         - | 3991855.36 KB |

Library code and benchmarks can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/MauiExcel){target="_blank"}.

## Limitations of the Custom Library

While the custom library is optimized for memory usage and performance, it has some limitations:

1. **Limited Formatting Support:**
   - Advanced styles, such as conditional formatting and rich text, are not fully supported.
   - Style definitions are simplified to reduce memory overhead.

2. **No Formula Evaluation:**
   - Formulas can be written to the file, but the library does not calculate or validate them.

## Conclusion

Focusing on targeted optimizations like data streaming, reduced formatting, and efficient object handling, I successfully developed a solution that significantly reduces memory usage for exporting large datasets to Excel. This approach benefits applications running in constrained environments or handling large data volumes.

The benchmark results demonstrate the effectiveness of the custom library. However, it is important to consider its limitations, especially if advanced Excel features or extensive formatting is required. For most use cases, the trade-off between simplicity and performance makes this solution an excellent choice.

If you’re dealing with similar challenges, consider analyzing your current library’s memory footprint and evaluating whether a custom implementation might better suit your needs. The investment in time and effort can pay off significantly in terms of performance and resource efficiency.

Happy holidays!