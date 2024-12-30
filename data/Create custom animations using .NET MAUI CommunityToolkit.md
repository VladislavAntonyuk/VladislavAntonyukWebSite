Hello!

This article describes how to create animations using .NET MAUI CommunityToolkit simply.

## Setup NuGet package
Let's start with installing the NuGet package. In the Solution Explorer panel, right-click on your project name and select **Manage NuGet Packages**. Search and install for **CommunityToolkit.Maui**. After installation enable `CommunityToolkit.Maui` in `MauiProgram.cs`:

```csharp
var builder = MauiApp.CreateBuilder();
builder.UseMauiApp<App>();
builder.UseMauiCommunityToolkit();
```

## BaseAnimation

.NET MAUI CommunityToolkit introduces `BaseAnimation` and `BaseAnimation<IAnimatable>` abstract classes for animation types to inherit. They already contain `Length` and `Easing` bindable properties and the abstract method `Animate`.

## Create simple animation

Assume you have a `VisualElement` that looks like the sun. Like in cartoons the sun scales and rotates at 360º. Let's animate it.

```csharp
public class SunAnimation : CommunityToolkit.Maui.Animations.BaseAnimation
{
	Animation Sun(VisualElement view)
	{
		var animation = new Animation();
		
		animation.WithConcurrent((f) => view.Rotation = f, 0, 360, Microsoft.Maui.Easing.Linear);
		animation.WithConcurrent((f) => view.Scale = f, 1, 1.4, Microsoft.Maui.Easing.Linear);

		return animation;
	}

	public override Task Animate(VisualElement view)
	{
		view.Animate("Sun", Sun(view), 16, Length, repeat:() => true);
		return Task.CompletedTask;
	}
}
```

Let's run our animation:

```csharp
var animation = new SunAnimation();
animation.Length = 5000;
animation.Animate(Sun);

// Let's now apply this animation to the wheel, which is also a VisualElement:
animation.Animate(Wheel)
```

## Create an animation for a custom element

Assume you have a custom element called `Cloud`. Clouds can fly in the sky and can scale. Let's animate them.

```csharp
public class CloudAnimation : CommunityToolkit.Maui.Animations.BaseAnimation<Cloud>
{
	Animation Cloud(Cloud view)
	{
		var animation = new Animation();

		animation.WithConcurrent((f) => view.TranslationX = f, view.TranslationX - 500, view.TranslationX + 1200, Microsoft.Maui.Easing.Linear);
		animation.WithConcurrent((f) => view.TranslationY = f, view.TranslationY, view.TranslationY + 300, Microsoft.Maui.Easing.Linear);
		animation.WithConcurrent((f) => view.Scale = f, 1, 1.5, Microsoft.Maui.Easing.Linear);

		return animation;
	}

	public override Task Animate(Cloud view)
	{
		view.Animate("Cloud", Cloud(view), 16, Length, repeat: () => true);
		return Task.CompletedTask;
	}
}
```

In this example, we apply animation explicitly to the `Cloud` control. We define an animation to concurrently run 3 animations: TransitionX, TransitionY, and Scale. Then, in method `Animate`, we run this Animation for our view.

## AnimationBehavior

The examples above showed how to run animation from C# code. What if I want to run it from Xaml? .NET MAUI CommunityToolkit has a tool for it. It's an `AnimationBehavior`.
The `AnimationBehavior` is a behavior that shows an animation on any `VisualElement` when the `AnimateCommand` is called or when the user taps on the control.

```xaml
<Cloud>
	<Cloud.Behaviors>
		<toolkit:AnimationBehavior>
			<toolkit:AnimationBehavior.AnimationType>
				<animations:CloudAnimation />
			</toolkit:AnimationBehavior.AnimationType>
		</toolkit:AnimationBehavior>
	</Cloud.Behaviors>
</Cloud>
```

That's it.

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/MauiAnimation){target="_blank"}.

Happy coding!