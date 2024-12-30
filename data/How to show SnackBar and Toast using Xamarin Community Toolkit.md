Hi there!

Today I am excited to announce a new category - Xamarin! Xamarin is an awesome open-source mobile app platform for .NET. While it is in a stage of evolution to .NET MAUI, I want to share a must-have package you will definitely love. And this is Xamarin Community Toolkit (XCT). This library contains a lot of features, which are used in almost all projects: behaviors, converters, effects, MVVM utilities, and awesome new controls including the CameraView, AvatarView, TabView, and much more.

In this article, I will describe how to use a new Snackbar and Toast to kindly notify users about any action in the app.

### Toast ###

A toast provides simple feedback about an operation in a small popup.

In XCT there are 2 different ways to use Toast.

1. The simple - on your Page call the method:
```csharp	
await MyPage.DisplayToastAsync(message, duration);	
```	
where `message` is your text, and `duration` is the timespan of toast (an optional parameter). Default duration = 3000 milliseconds;	

![Toast1](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/4/toast1.png)

2. With advanced settings you can customize Message options and Toast options:	
```csharp	
    var messageOptions = new MessageOptions	
    {	
        Foreground = Color.Black,	
        Font = Font.SystemFontOfSize(16),
        Message = "My text"	
    };	
    var options = new ToastOptions	
    {	
        MessageOptions = messageOptions,	
        Duration = TimeSpan.FromMilliseconds(3000),	
        BackgroundColor = Color.Default,	
        IsRtl = false
    };	
    await this.DisplayToastAsync(options);	
```	

![Toast2](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/4/toast2.png)

### Snackbar ###

Snackbars inform users of a process that an app has performed or will perform. They appear temporarily, towards the bottom of the screen

Snackbar has an API that is similar to Toast.	

1. Simple execution with predefined settings. On your Page call the method: 	
```csharp	
var result = await MyPage.DisplaySnackbarAsync(message, actionButtonText, action, duration);
```	
where `message` is your text, `actionButtonText` is the text for the button, `action` is a `Func<Task>` and `duration` is optional parameter. Default duration = 3000 milliseconds;

The result is `Boolean`. `True` - if Snackbar is closed by the user. `False` - if Snackbar is closed by timeout.

![Snackbar1](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/4/snackbar1.png)

2. With advanced settings you have a full control for all `MessageOptions`, `SnackBarActionOptions` and `SnackBarOptions`:
```csharp	
    var messageOptions = new MessageOptions	
    {	
        Foreground = Color.Black,	
        Font = Font.SystemFontOfSize(16),
        Message = "My text"	
    };	
    var actionOptions = new List<SnackBarActionOptions>	
    {	
        new SnackBarActionOptions	
        {	
            ForegroundColor = Color.Black,	
            BackgroundColor = Color.White,	
            FontFamily = Font.SystemFontOfSize(14),	
            Text = "Action 1",	
            Action = () => // null by default	
            {	
                Debug.WriteLine("1");	
                return Task.CompletedTask;	
            }	
        },
        new SnackBarActionOptions	
        {	
            ForegroundColor = Color.Black,	
            BackgroundColor = Color.White,	
            FontFamily = Font.SystemFontOfSize(16),
            Text = "Action 2",	
            Action = () => // null by default	
            {	
                Debug.WriteLine("1");	
                return Task.CompletedTask;	
            }	
        }	
    };	
    var options = new SnackbarOptions	
    {	
        MessageOptions = messageOptions,	
        Duration = TimeSpan.FromMilliseconds(3000),
        BackgroundColor = Color.Default,	
        IsRtl = false,	
        Actions = actionOptions	
    };	
    var result = await this.DisplaySnackbarAsync(options);	
```

![Snackbar2](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/4/snackbar2.png)

## Details of implementation and limitations for different platforms ##

### I ###
Both Toast and Snackbar work on all platforms: Android, iOS, macOS, UWP, WPF, GTK, and Tizen.

### II ###
Both Toast and Snackbar by default use native colors and automatically change them depending on the system theme.

### III ###
"Native" Toast and Snackbar is available only on Android and was created by Google.

Other platforms use "Container" (UIView for iOS, NSView for macOS, Grid for WPF, HBox for GTK, and Dialog for Tizen) to display a message and action buttons.

Because of Android limitations, it has only 1 action button, while all other platforms can display multiple action buttons.

### IV ###
Android uses snackbar for both `DisplayToastAsync` and `DisplaySnackbarAsync`. The difference is that `DisplayToastAsync` hides the action button.

## Nightly builds and new API ##

### Update 1 - Set the Padding ###
A new property `Thickness Padding { get; set; }` was added to `MessageOptions` and `SnackBarActionOptions`.

### Update 2 - Set the Anchor ###
Now you can anchor the toast and the snackbar to any VisualElement like this:
```
var result = await MyButton.DisplaySnackbarAsync(message, actionButtonText, action, duration);
```
![Anchored Toast](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/4/toast3.png)


Feel free to try it and leave your feedback. Happy coding!