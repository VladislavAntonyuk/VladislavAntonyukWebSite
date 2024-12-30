Hello!

You must have noticed that in many Android apps, you can exit only after double-clicking on the back button. A toast message appears when you press the back button once. When you simultaneously press the back button you exit your apps.

This is usually implemented in `MainActivity` by overriding the `OnBackPressed` method. The code below demonstrates the possible implementation:
```csharp
public override void OnBackPressed()
{
	var navigation = Microsoft.Maui.Controls.Application.Current?.MainPage?.Navigation;
	if (navigation is null || navigation.NavigationStack.Count > 1 || navigation.ModalStack.Count > 0)
	{
		base.OnBackPressed();
	}
	else
	{
		const int delay = 2000;
		if (backPressed + delay > DateTimeOffset.UtcNow.ToUnixTimeMilliseconds())
		{
			FinishAndRemoveTask();
			Process.KillProcess(Process.MyPid());
		}
		else
		{
			Toast.MakeText(ApplicationContext, "Close", ToastLength.Long)?.Show();
			backPressed = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
		}
	}
}
```

This worked great before Android 13 (SDK version 33). Starting from this release, `OnBackPressed` is deprecated. 
![Deprecated ](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/28/2.png)

So what is the alternative?

In Android 13, the new API is implemented to support predictive back gestures.

This feature will let a user preview the result of a Back gesture before they fully complete it - basically allowing them to decide whether to stay in the current view or complete the action and return to the Home screen, previous activity or a previously visited page in a WebView.
To support the predictive back gesture, Android 13 adds the new window-level `OnBackInvokedCallback` platform API. This API replaces the `KeyEvent.KEYCODE_BACK API` and all platform classes that use `OnBackPressed`.

Let's start with implementing `OnBackPressedCallback`:

```csharp
private class BackPress : OnBackPressedCallback
{
	private readonly Activity activity;
	private long backPressed;

	public BackPress(Activity activity) : base(true)
	{
		this.activity = activity;
	}

	public override void HandleOnBackPressed()
	{
		var navigation = Microsoft.Maui.Controls.Application.Current?.MainPage?.Navigation;
		if (navigation is not null && navigation.NavigationStack.Count <= 1 && navigation.ModalStack.Count <= 0)
		{
			const int delay = 2000;
			if (backPressed + delay > DateTimeOffset.UtcNow.ToUnixTimeMilliseconds())
			{
				activity.FinishAndRemoveTask();
				Process.KillProcess(Process.MyPid());
			}
			else
			{
				Toast.MakeText(activity, "Close", ToastLength.Long)?.Show();
				backPressed = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
			}
		}
	}
}
```

You need to override the method `HandleOnBackPressed`. The content of this method is pretty much the same as in `OnBackPressed`.

In the final step, we need to add this callback. It can be done by overriding `OnCreate` method of `MainActivity`:

```csharp
protected override void OnCreate(Bundle? savedInstanceState)
{
	base.OnCreate(savedInstanceState);
	OnBackPressedDispatcher.AddCallback(this, new BackPress(this));
}
```

`OnBackPressedDispatcher` dispatches system back button pressed events to one or more `OnBackPressedCallback` instances.

Here is the result:
![Back pressed in Android 33](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/28/animation.gif)