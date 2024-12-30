Hi there!

Today I am excited to announce a new preview release of the `.NET MAUI CommunityToolkit`. It is a successor of the `Xamarin Community Toolkit` for `.NET MAUI`. So if you are porting your `Xamarin.Forms` application to `.NET MAUI`, `.NET MAUI CommunityToolkit` is a must-have package you will definitely love.

In this article, I will describe how to use a newly added Snackbar and Toast to kindly notify users about any action in the app.

First of all, you need to install `.NET MAUI CommunityToolkit` NuGet package:

```xml
<PackageReference Include="CommunityToolkit.Maui" Version="1.0.0" />
```

You also have to register the package in `MauiProgram.cs`:

```csharp
builder.UseMauiApp<App>().UseMauiCommunityToolkit();
```

That's all you need to set up the toolkit. Now let's back to toast and snackbar.

### Toast ###

A toast provides simple feedback about an operation in a small alert.

To display `Toast` you need to create it, using the static method `Make`:

```csharp	
using CommunityToolkit.Maui.Alerts;
var toast = Toast.Make(message, duration, fontSize);
await toast.Show(cancellationToken);
```	
where `message` is your text, and `duration` is the enum of `ToastDuration`. The default duration is `Short`. `FontSize` is optional and equals `14` by default.

When you run the command above, you should see the toast:

![Toast](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/17/maui-toast.png)

You can also dismiss the toast by running `toast.Dismiss(cancellationToken);`.

It's important to mention, that you can display only 1 toast at the same time. If you call the `Show` method a second time, the first toast will be dismissed.

### Snackbar	###

Snackbars inform users of a process that an app has performed or will perform. They appear temporarily, towards the bottom of the screen

The simplest way to create a snackbar is using the static method `Make`:

```csharp
using CommunityToolkit.Maui.Alerts;
var options = new SnackbarOptions
{
    BackgroundColor = Colors.Red,
    TextColor = Colors.Green,
    ActionButtonTextColor = Colors.Yellow,
    CornerRadius = new CornerRadius(10),
    Font = Font.SystemFontOfSize(14),
    ActionButtonFont = Font.SystemFontOfSize(14),
    CharacterSpacing = 0.5
};
var snackbar = Snackbar.Make(message, action, actionButtonText, duration, visualOptions, anchorVisualElement);
await snackbar.Show(token);
```
`Message` is required for the snackbar. All other parameters are optional. You can set `action`, which is executed when you click on the action button. You can customize `actionButtonText`, set `duration` using `TimeSpan`, override default `visualOptions` to make your snackbar style unique, and anchor the snackbar to the `VisualElement`.

There is also an extension method, which allows you to anchor the snackbar to any `VisualElement`:
```csharp
await MyVisualElement.DisplaySnackbar(
    "Snackbar is awesome. It is anchored to my visual element",
    RunAwesomeAction,
    "Make snackbar even better",
    TimeSpan.FromSeconds(5),
    options,
    CancellationToken.None);	
```

![Snackbar](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/17/maui-snackbar.png)

Snackbar also can be dismissed using `Dismiss(CancellationToken)` method.

It is also possible to subscribe to SnackBar events: `Shown` and `Dismissed` and check if SnackBar is shown with `IsShown` property.

```csharp
Snackbar.Shown += (s, e) => { Console.WriteLine(Snackbar.IsShown); };
Snackbar.Dismissed += (s, e) => { Console.WriteLine(Snackbar.IsShown); };
```

## Details of implementation and limitations for different platforms ##

### I ###
Both Toast and Snackbar were reworked from scratch compared to Xamarin Community Toolkit, so there are some breaking changes.

### II ###
The API allows you to override existing methods with your own implementation or even create your own Snackbar and Toast, by implementing `ISnackbar` and `IToast` interfaces.

### III ###
"Native" Toast and Snackbar are available only on Android and were created by Google.

Other platforms use "Container" (UIView for iOS and MacCatalyst, ToastNotification on Windows) to display a message and action button.

### IV ###
Snackbar on Windows can't be anchored to `VisualElement` and is always displayed as the default Windows Notification.

Feel free to try it and leave your feedback. Happy coding!