While most of you are excited about Apple's WWDC 2024, I am silently publishing the article on simplifying .NET MAUI App development.

Developing mobile applications can be a rewarding experience, but debugging and monitoring their behavior can often be challenging. Especially in the realm of .NET MAUI app development, pinpointing issues, tracking resource usage, and finding the perfect element placement can be time-consuming. Fortunately, there are some helpful tools available on GitHub that can streamline this process.

In this article, we'll explore two repositories that offer valuable functionalities for .NET MAUI developers:

- .NET MAUI Debug Tools by @jsuarezruiz (https://github.com/jsuarezruiz/maui-dev-tools)
- Plugin.Maui.DebugRainbows by @sthewissen (https://github.com/sthewissen/Plugin.Maui.DebugRainbows)

## .NET MAUI Debug Tools

![.NET MAUI Debug Tools](https://github.com/jsuarezruiz/maui-dev-tools/raw/main/images/maui-dev-tools.gif)

This repository provides a set of extensions for the Visual Studio debugging experience specifically designed for Maui apps. These extensions can enhance your debugging capabilities by offering features like:

- Improved element inspection: Gain deeper insights into the visual tree of your app, allowing for easier identification and manipulation of UI elements.
- Live property editing: Modify properties of your app's elements in real-time, without the need to recompile and redeploy, for a faster development workflow.
- Memory and performance monitoring: Keep track of your app's resource usage and identify potential performance bottlenecks.

### Adding .NET MAUI Dev Tools

As the project is still under development you can get the source code to your project from [MauiDevTools](https://github.com/jsuarezruiz/maui-dev-tools/tree/main/src/MauiDevTools).

Once you add the project, you can easily add it to your app with one line of code:
```csharp
builder.UseMauiApp<App>().UseMauiDevTools();
```

When debugging a .NET MAUI app, you'll see the new .NET MAUI Dev Tools options overlay.

## Plugin.Maui.DebugRainbows

![Plugin.Maui.DebugRainbows](https://raw.githubusercontent.com/sthewissen/Plugin.Maui.DebugRainbows/main/images/sample.png)

This repository offers a debugging aid in the form of a NET MAUI plugin. It simplifies visually identifying the bounds of UI elements within your app. By enabling the plugin, a rainbow overlay will be displayed on top of your app, highlighting the exact position and dimensions of each element. This can be incredibly useful for ensuring proper layout and alignment.

### Adding Plugin.Maui.DebugRainbows:

Install the `Plugin.Maui.DebugRainbows` NuGet package into your Maui project.
In your app's `MauiProgram.cs` file, add the following line to the ConfigureServices method:

```csharp
builder.UseMauiApp<App>()
        // This will add the rainbow backgrounds by default.
        .UseDebugRainbows();
```

## Conclusion
These two GitHub repositories offer valuable tools for .NET MAUI developers looking to streamline their debugging and monitoring workflows. `.NET MAUI Debug Tools` provides a comprehensive set of extensions for enhanced monitoring and debugging of your apps, while `Plugin.Maui.DebugRainbows` offers a simple yet effective way to visualize element bounds. By incorporating these tools into your development process, you can save time and effort, leading to a more efficient and enjoyable development experience.