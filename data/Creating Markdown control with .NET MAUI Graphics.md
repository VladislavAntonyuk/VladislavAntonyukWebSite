Hello and welcome to 2023! 👋

This article is devoted to creating a simple Markdown control using .NET MAUI Graphics.

.NET MAUI Graphics is a cross-platform API for drawing 2D graphics in .NET applications.

The `Microsoft.Maui.Graphics` namespace provides a cross-platform 2D graphics canvas that supports drawing and painting shapes and images, compositing operations, and graphical object transforms. You can read more about it on [Microsoft docs](https://docs.microsoft.com/en-us/dotnet/maui/user-interface/graphics){target="_blank"}.

Let's see how to add this cool API to your application.

## Markdown control

`.NET MAUI` has a `GraphicsView` control. It is a graphics canvas for drawing 2D graphics.

Let's create a `MarkdownGraphicsView` control:

```csharp
using Maui.BindableProperty.Generator.Core;

public partial class MarkdownGraphicsView : GraphicsView
{
	[AutoBindable(OnChanged = nameof(OnTextChanged))]
	private string? text;

	[AutoBindable(OnChanged = nameof(OnFontSizeChanged))]
	private float fontSize;

	[AutoBindable(OnChanged = nameof(OnFontColorChanged))]
	private Color fontColor = Colors.Black;

	private void OnTextChanged(string? oldValue, string? newValue)
	{
		Render();
	}
	private void OnFontSizeChanged(float oldValue, float newValue)
	{
		Render();
	}
	private void OnFontColorChanged(Color oldValue, Color newValue)
	{
		Render();
	}

	private void Render()
	{
		Drawable = new MarkdownDrawable(Text ?? string.Empty, FontColor, FontSize, Width, Height);
	}
}
```

> I use `M.BindableProperty.Generator` Nuget package to simplify bindable property code generation.

## MarkdownDrawable

 `GraphicsView` defines the `Drawable` property, which specifies the content that will be drawn.

 To create a new drawable we need to implement `Draw` method of `IDrawable` interface.

```csharp
using Markdig;
using Microsoft.Maui.Graphics.Text;
using Microsoft.Maui.Graphics.Text.Renderer;
using Font = Microsoft.Maui.Graphics.Font;

public class MarkdownDrawable : IDrawable
{
	private readonly string text;
	private readonly Color fontColor;
	private readonly float fontSize;
	private readonly int markdownWidth;
	private readonly int markdownHeight;

	public MarkdownDrawable(string text, Color fontColor, double fontSize, double markdownWidth, double markdownHeight)
	{
		this.text = text;
		this.fontColor = fontColor;
		this.fontSize = (float)fontSize;
		this.markdownWidth = (int)markdownWidth;
		this.markdownHeight = (int)markdownHeight;
	}

	public void Draw(ICanvas canvas, RectF dirtyRect)
	{
		canvas.Font = Font.Default;
		canvas.FontSize = fontSize;
		canvas.FontColor = fontColor;
		var attributedText = Read(text);
		canvas.DrawText(attributedText, 0, 0, markdownWidth, markdownHeight);
	}

	private static IAttributedText Read(string text)
	{
		var renderer = new AttributedTextRenderer();
		renderer.ObjectRenderers.Add(new MauiCodeInlineRenderer());
		renderer.ObjectRenderers.Add(new MauiCodeBlockRenderer());
		renderer.ObjectRenderers.Add(new MauiHeadingRenderer());
		var builder = new MarkdownPipelineBuilder().UseEmojiAndSmiley().UseEmphasisExtras();
		var pipeline = builder.Build();
		Markdig.Markdown.Convert(text, renderer, pipeline);
		return renderer.GetAttributedText();
	}
}
```

Please take a look at `Read` method. .NET MAUI already has a `MarkdownAttributedTextReader`. So, for a simple scenario you can replace the code with:

```csharp
private static IAttributedText Read(string text)
{
	return MarkdownAttributedTextReader.Read(text);
}
```

But, if you want to implement a custom renderer, or use your Markdown converter (Markdig is currently used), keep it as it is.

## CustomRenderer

The final step is implementing a custom renderer for a specific markdown block.

Let's implement it for `CodeInline`. The `CodeInline` is a block of text you put in single quotes (`).

```csharp
using Markdig.Syntax.Inlines;
using Microsoft.Maui.Graphics.Text;
using Microsoft.Maui.Graphics.Text.Renderer;

public class MauiCodeInlineRenderer : AttributedTextObjectRenderer<CodeInline>
{
	protected override void Write(AttributedTextRenderer renderer, CodeInline inlineBlock)
	{
		var start = renderer.Count;
		var attributes = new TextAttributes();
		attributes.SetForegroundColor("#d63384");
		renderer.Write(inlineBlock.Content);
		var length = renderer.Count - start;
		renderer.Call("AddTextRun", start, length, attributes);
	}
}
```

We also need to call `Renderer.AddTextRun` method, but it is internal in .NET MAUI. But we still can call it using reflection:

```csharp
static class AccessExtensions
{
	public static void Call(this object o, string methodName, params object[] args)
	{
		var mi = o.GetType().GetMethod (methodName, System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
		mi?.Invoke (o, args);
	}
}
```

## Result

![Android](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/35/android.png)

<center>Markdown on Android</center>

![Markdown on iOS](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/35/ios.png)

<center>Markdown on iOS</center>

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/MauiMarkdown){target="_blank"}.

Happy coding!