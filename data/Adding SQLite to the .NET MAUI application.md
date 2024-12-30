Almost every application needs to store data. Today I will show you how to connect SQLite to the .NET MAUI application.

First of all, we need to install NuGet packages:
```xml
<PackageReference Include="sqlite-net-pcl" Version="1.8.116" />
<PackageReference Include="SQLitePCLRaw.core" Version="2.1.0" />
<PackageReference Include="SQLitePCLRaw.bundle_green" Version="2.1.0" />
<PackageReference Include="SQLitePCLRaw.provider.dynamic_cdecl" Version="2.1.0" />
<PackageReference Include="SQLitePCLRaw.provider.sqlite3" Version="2.1.0" />
```

Then create repository class:
```csharp
private readonly SQLiteConnection _database;

public Repository()
{
    var dbPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "entities.db");
    _database = new SQLiteConnection(dbPath);
    _database.CreateTable<MyEntity>();
}

public List<MyEntity> List()
{
    return _database.Table<MyEntity>().ToList();
}

public int Create(MyEntity entity)
{
    return _database.Insert(entity);
}

public int Update(MyEntity entity)
{
    return _database.Update(entity);
}

public int Delete(MyEntity entity)
{
    return _database.Delete(entity);
}
```

It's up to you how you initialize the database and which methods to implement.

To use the repository update the `MainPage`:
```csharp
private readonly Repository repository;

public MainPage()
{
    repository = new Repository();
    InitializeComponent();
}

protected override void OnAppearing()
{
    base.OnAppearing();
    GetEntities();
}

private void GetEntities()
{
    collectionView.ItemsSource = repository.List();
}
```

*Important part for iOS*

For iOS/MacCatalyst we need to set the SQLite provider. We can do it in `AppDelegate`:
```csharp
protected override MauiApp CreateMauiApp()
{
    raw.SetProvider(new SQLite3Provider_sqlite3());
    return MauiProgram.CreateMauiApp();
}
```
![.NET MAUI Sqlite](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/14/sqlite2.png)

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/Sqlite/MauiSqlite){target="_blank"}.

The .NET MAUI Blazor sample can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/Sqlite/MauiSqliteBlazor){target="_blank"}.

The sample with EntityFramework Core can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/KanbanBoard){target="_blank"}.