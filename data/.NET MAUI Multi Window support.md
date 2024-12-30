Howdy! 👋
It is almost 2022 and .NET MAUI team non-stop delivers new features for the upcoming MAUI year!

.NET MAUI Preview 11 was silently released ([release notes](https://gist.github.com/Redth/347292446cc1d7f3bd381a2acae70c11){target="_blank"}) with Multi-Window support! Let's see how to add this cool feature to your application.

1. Run `dotnet workload update` to update to the latest .NET MAUI Preview version. We need at least **Preview 11**.
2. To open the window we need just 2 lines of code: the first line initializes a new window with a Page inside, and the second line just opens the window:
```csharp
var newWindow = new Window(new SecondPage());
Application.Current?.OpenWindow(newWindow);
```
3. Closing the window is even simpler - we need just 1 line of code.

To close the current window call the next command:
```csharp
Application.Current?.CloseWindow(GetParentWindow());
```

To close a specific window pass the instance of that window to the method:
```csharp
var myLastWindow = Application.Current?.Windows.Last();
Application.Current?.CloseWindow(myLastWindow);
```

### Platform configurations

#### iOS/MacCatalyst
1. Create and register `SceneDelegate`
```csharp
[Register(nameof(SceneDelegate))]
public class SceneDelegate : MauiUISceneDelegate
{
}
```

2. Open `Info.plist` and add the next content to the end of the file:
```xml
<key>UIApplicationSceneManifest</key>
<dict>
	<key>UIApplicationSupportsMultipleScenes</key>
	<true/>
	<key>UISceneConfigurations</key>
	<dict>
		<key>UIWindowSceneSessionRoleApplication</key>
		<array>
			<dict>
				<key>UISceneConfigurationName</key>
				<string>__MAUI_DEFAULT_SCENE_CONFIGURATION__</string>
				<key>UISceneDelegateClassName</key>
				<string>SceneDelegate</string>
			</dict>
		</array>
	</dict>
</dict>
```

![MAUI Multi Window on iOS](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/15/multi-window-ios.gif)

<center>Multi-Window on iOS</center>

![MAUI Multi Window on macOS](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/15/multi-window-macos.gif)

<center>Multi-Window on macOS</center>

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/MauiMultiWindow){target="_blank"}.

Happy holidays! 🎄🎁