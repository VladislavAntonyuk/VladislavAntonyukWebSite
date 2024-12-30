Hello!

This blog post is devoted to setting a cursor for `.NET MAUI VisualElement`.

Let's start with defining a `CursorIcon` enumeration:
    
```csharp
public enum CursorIcon
{
    Wait,
    Hand,
    Arrow,
    IBeam,
    Cross,
    SizeAll
}
```

It will be used for mapping platform-specific cursors.

## Platform-Specific Implementations

### Android

Create a new file named `CursorExtensions.cs` in the `Platforms\Android` folder and add the following code:

```csharp
using Application = Android.App.Application;

public static class CursorExtensions
{
    public static void SetCustomCursor(this VisualElement visualElement, CursorIcon cursor, IMauiContext? mauiContext)
    {
        if (OperatingSystem.IsAndroidVersionAtLeast(24))
        {
            ArgumentNullException.ThrowIfNull(mauiContext);
            var view = visualElement.ToPlatform(mauiContext);
            view.PointerIcon = PointerIcon.GetSystemIcon(Application.Context, GetCursor(cursor));
        }
    }

    static PointerIconType GetCursor(CursorIcon cursor)
    {
        return cursor switch
        {
            CursorIcon.Hand => PointerIconType.Hand,
            CursorIcon.IBeam => PointerIconType.AllScroll,
            CursorIcon.Cross => PointerIconType.Crosshair,
            CursorIcon.Arrow => PointerIconType.Arrow,
            CursorIcon.SizeAll => PointerIconType.TopRightDiagonalDoubleArrow,
            CursorIcon.Wait => PointerIconType.Wait,
            _ => PointerIconType.Default,
        };
    }
}
```

Please pay attention. The `PointerIcon` API works on Android 24 and later.

### iOS

Create a new file named `CursorExtensions.cs` in the `Platforms\iOS` folder and add the following code:

```csharp
public static class CursorExtensions
{
    public static void SetCustomCursor(this VisualElement visualElement, CursorIcon cursor, IMauiContext? mauiContext)
    {
        ArgumentNullException.ThrowIfNull(mauiContext);
        var view = visualElement.ToPlatform(mauiContext);
        view.UserInteractionEnabled = true;
        foreach (var interaction in view.Interactions.OfType<UIPointerInteraction>())
        {
            view.RemoveInteraction(interaction);
        }

        view.AddInteraction(new UIPointerInteraction(new PointerInteractionDelegate(cursor)));
    }

    class PointerInteractionDelegate : UIPointerInteractionDelegate
    {
        private readonly CursorIcon icon;

        public PointerInteractionDelegate(CursorIcon icon)
        {
            this.icon = icon;
        }

        public override UIPointerStyle? GetStyleForRegion(UIPointerInteraction interaction, UIPointerRegion region)
        {
            if (interaction.View == null) { return null; }
            string pathData = "M14.9263942,24.822524 C15.7714904,24.822524 16.3700962,24.0948077 16.804375,22.9680048 L24.4925481,2.88509615 C24.7038462,2.34516827 24.8211538,1.86391827 24.8211538,1.46485577 C24.8211538,0.701899038 24.3516827,0.232403846 23.5887019,0.232403846 C23.1896635,0.232403846 22.7084135,0.349783654 22.1685096,0.561057692 L1.97987981,8.29608173 C0.993942308,8.67168269 0.230995192,9.2703125 0.230995192,10.1271394 C0.230995192,11.2069952 1.05262019,11.5708654 2.17942308,11.91125 L8.51769231,13.8362019 C9.26889423,14.0709615 9.67971154,14.047476 10.1961538,13.5779808 L23.0605769,1.54699519 C23.2129808,1.40615385 23.3891827,1.42963942 23.5182692,1.53526442 C23.6355769,1.65264423 23.6473558,1.82870192 23.5064904,1.98129808 L11.5107692,14.9043269 C11.0647356,15.3855529 11.0295192,15.7846394 11.252524,16.5710337 L13.1187981,22.7684615 C13.4709375,23.9539423 13.8347837,24.822524 14.9263942,24.822524 Z";
            var pathGeometry = new PathGeometryConverter().ConvertFromString(pathData) as PathGeometry;
            var path = UIBezierPath.FromPath(pathGeometry.ToCGPath().Data);
            return UIPointerStyle.Create(UIPointerShape.Create(path), UIAxis.Both);
        }
    }
}
```

`UIPointerStyle.Create` can be created from different shapes. However, I haven't found predefined cursors for our `CursorIcon`. The option, for now, is to create a custom icon from the path.

### MacCatalyst

Create a new file named `CursorExtensions.cs` in `Platforms\MacCatalyst` folder and add the following code:

```csharp
using AppKit;

public static class CursorExtensions
{
    public static void SetCustomCursor(this VisualElement visualElement, CursorIcon cursor, IMauiContext? mauiContext)
    {
        ArgumentNullException.ThrowIfNull(mauiContext);
        var view = visualElement.ToPlatform(mauiContext);
        if (view.GestureRecognizers is not null)
        {
            foreach (var recognizer in view.GestureRecognizers.OfType<PointerUIHoverGestureRecognizer>())
            {
                view.RemoveGestureRecognizer(recognizer);
            }
        }

        view.AddGestureRecognizer(new PointerUIHoverGestureRecognizer(r =>
        {
            switch (r.State)
            {
                case UIGestureRecognizerState.Began:
                    GetNSCursor(cursor).Set();
                    break;
                case UIGestureRecognizerState.Ended:
                    NSCursor.ArrowCursor.Set();
                    break;
            }
        }));
    }

    static NSCursor GetNSCursor(CursorIcon cursor)
    {
        return cursor switch
        {
            CursorIcon.Hand => NSCursor.OpenHandCursor,
            CursorIcon.IBeam => NSCursor.IBeamCursor,
            CursorIcon.Cross => NSCursor.CrosshairCursor,
            CursorIcon.Arrow => NSCursor.ArrowCursor,
            CursorIcon.SizeAll => NSCursor.ResizeUpCursor,
            CursorIcon.Wait => NSCursor.OperationNotAllowedCursor,
            _ => NSCursor.ArrowCursor,
        };
    }

    class PointerUIHoverGestureRecognizer : UIHoverGestureRecognizer
    {
        public PointerUIHoverGestureRecognizer(Action<UIHoverGestureRecognizer> action) : base(action)
        {
        }
    }
}
```

Unlike `iOS`, `MacCatalyst` has an `NSCursor` class with predefined cursors. `UIHoverGestureRecognizer` helps us to set a custom cursor on the Hover event.

### Windows

To set the custom cursor on Windows, create a new file named `CursorExtensions.cs` in the `Platforms\Windows` folder and add the following code:

```csharp
public static class CursorExtensions
{
    public static void SetCustomCursor(this VisualElement visualElement, CursorIcon cursor, IMauiContext? mauiContext)
    {
        ArgumentNullException.ThrowIfNull(mauiContext);
        UIElement view = visualElement.ToPlatform(mauiContext);
        view.PointerEntered += ViewOnPointerEntered;
        view.PointerExited += ViewOnPointerExited;
        void ViewOnPointerExited(object sender, PointerRoutedEventArgs e)
        {
            view.ChangeCursor(InputCursor.CreateFromCoreCursor(new CoreCursor(GetCursor(CursorIcon.Arrow), 1)));
        }

        void ViewOnPointerEntered(object sender, PointerRoutedEventArgs e)
        {
            view.ChangeCursor(InputCursor.CreateFromCoreCursor(new CoreCursor(GetCursor(cursor), 1)));
        }
    }

    static void ChangeCursor(this UIElement uiElement, InputCursor cursor)
    {
        Type type = typeof(UIElement);
        type.InvokeMember("ProtectedCursor", BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.SetProperty | BindingFlags.Instance, null, uiElement, new object[] { cursor });
    }

    static CoreCursorType GetCursor(CursorIcon cursor)
    {
        return cursor switch
        {
            CursorIcon.Hand => CoreCursorType.Hand,
            CursorIcon.IBeam => CoreCursorType.IBeam,
            CursorIcon.Cross => CoreCursorType.Cross,
            CursorIcon.Arrow => CoreCursorType.Arrow,
            CursorIcon.SizeAll => CoreCursorType.SizeAll,
            CursorIcon.Wait => CoreCursorType.Wait,
            _ => CoreCursorType.Arrow,
        };
    }
}
```

`UIElement` is a base class for all UI elements. It has a protected `ProtectedCursor` property that we can use to set a custom cursor. It is a very odd decision to make this property protected. We need to use reflection to set its value.

## Using the Custom Cursor in Your Application

```csharp
MyVisualElement.SetCustomCursor(CursorIcon.Hand, MyVisualElement.Handler?.MauiContext);
```

With this code, we set the cursor to a "Hand" style when the mouse pointer is over the "MyVisualElement" control.

## Creating the Attached Property 

In order to set a custom cursor from `XAML`, let's create an attached property.

Create a new file in the root of the project named `CursorBehavior.cs` and paste the following code:

```csharp
public class CursorBehavior
{
    public static readonly BindableProperty CursorProperty = BindableProperty.CreateAttached("Cursor", typeof(CursorIcon), typeof(CursorBehavior), CursorIcon.Arrow, propertyChanged: CursorChanged);

    private static void CursorChanged(BindableObject bindable, object oldvalue, object newvalue)
    {
        if (bindable is VisualElement visualElement)
        {
            visualElement.SetCustomCursor((CursorIcon)newvalue, Application.Current?.MainPage?.Handler?.MauiContext);
        }
    }

    public static CursorIcon GetCursor(BindableObject view) => (CursorIcon)view.GetValue(CursorProperty);

    public static void SetCursor(BindableObject view, CursorIcon value) => view.SetValue(CursorProperty, value);
}
```

Now that we have implemented the attached property for setting custom cursors, let's use it in our `MainPage.xaml`.

Open `MainPage.xaml` and add the following code inside the `ContentPage` element:

```xml
  <Button
      local:CursorBehavior.Cursor="Hand"
      Text="Click me!" />
```

![Windows Cursor](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/40/windows.gif)

The final code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/MauiCursor){target="_blank"}.

Happy coding!