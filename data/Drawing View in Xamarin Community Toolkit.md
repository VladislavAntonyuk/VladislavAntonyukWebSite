Hello!

The community continues to improve Xamarin.CommunityToolkit and today the new control was added. Welcome, DrawingView!

DrawingView is an improved version of the SignaturePad plugin. It works on all platforms and is supported by the community.

DrawingView allows you to draw lines, save the image and restore it by settings the list of lines.

Let's now add it to our project.

### Using DrawingView on Xamarin.Forms

1. We need to add the Xamarin.CommunityToolkit namespace:
```xml
xmlns:views="clr-namespace:Xamarin.CommunityToolkit.UI.Views;assembly=Xamarin.CommunityToolkit"
```
2. Add the control:
```xml
<views:DrawingView
            x:Name="DrawingViewControl"
            Lines="{Binding MyLines}"
            MultiLineMode="true"
            ClearOnFinish="true"
            DrawingLineCompletedCommand="{Binding DrawingLineCompletedCommand}"
            DrawingLineCompleted="OnDrawingLineCompletedEvent"
            DefaultLineColor="Red"
            DefaultLineWidth="5"
            BackgroundColor="DarkGray"
            HorizontalOptions="FillAndExpand"
            VerticalOptions="FillAndExpand" />
```
- We can bind to the `Lines` property and set lines in ViewModel. 
- If `MultiLineMode` is set to `true` we can draw multiple lines, otherwise, the old lines are removed.
- If `ClearOnFinish` is set to `true` the points will be cleaned right after we finished the drawing.
- `DrawingLineCompletedCommand` and `DrawingLineCompleted` are executed when we finish drawing the line.
- We can set default values for all lines using `DefaultLineColor` and `DefaultLineWidth`.

### Lines
DrawingView allows configuring each line individually. Let's see what we can do:
- Each line has a collection of `Points`.
- For each line, we can set the drawing line color and width using `LineColor` and `LineWidth` properties respectively.
- For making the line smooth we can set `EnableSmoothedPath` to true and we can configure the smooth level using `Granularity`.

![DrawingView](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/7/2.png)

### Get an image from lines

There are 2 different ways how you can get the image stream:
We can choose the `GetImageStream` static method from the `DrawingView`. We need to path the list of lines, the size of the image (minimum size is 1x1), and the background color.
```csharp
var stream = DrawingView.GetImageStream(
                lines,
                new Size(GestureImage.Width, GestureImage.Height),
                Color.Black);
```

Or we can call this method directly from your control. In that case, we only need to specify the image size.
```csharp
var stream = DrawingViewControl.GetImageStream(GestureImage.Width, GestureImage.Height);
```

Both methods return stream, so to get the image source you can call `ImageSource.FromStream(() => stream)`

![DrawingView iOS](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/7/3.png)

### Get an image from points

There are 2 different ways how you can get the image stream:
We can choose the `GetImageStream` static method from the `Line`. We need to path the list of points, the size of the image (minimum size is 1x1), line width, line color, and background color.
```csharp
var stream = DrawingView.GetImageStream(
                points,
                new Size(GestureImage.Width, GestureImage.Height),
                10, Color.Red, Color.Black);
```

Or we can call the instance method directly. In that case, we only need to specify the image size and background color.
```csharp
var stream = MyLine.GetImageStream(GestureImage.Width, GestureImage.Height, Color.Black);
```

Both methods return stream, so to get the image source you can call `ImageSource.FromStream(() => stream)`

## Notes for WPF developers
WPF implementation required calling an additional method so we decided to exclude WPF Renderer from the plugin. But you can still add it manually. You can find the latest code here: [GitHub](https://github.com/xamarin/XamarinCommunityToolkit/blob/develop/samples/XCT.Sample.WPF/DrawingViewRenderer.wpf.cs)

That's pretty much it. Hope you will enjoy the new DrawingView control!