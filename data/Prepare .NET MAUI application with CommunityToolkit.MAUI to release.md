`FadeAnimation`, `GravatarImageSource`, `StatusBar color`. All these features are available with `CommunityToolkit.MAUI` *1.3.0*. And that's not all.

Usually, to start working with the `.NET MAUI Community Toolkit`, you need to initialize it with `MauiAppBuilder` by calling the `UseMauiCommunityToolkit` method:

```csharp
var builder = MauiApp.CreateBuilder();
builder.UseMauiApp<App>();
builder.UseMauiCommunityToolkit();
```

Starting from this release you can get even more control over the `ComminityToolkit.Maui` library and `CommunityToolkit.Maui.Options` can help you with that:

```csharp
var builder = MauiApp.CreateBuilder();
builder.UseMauiApp<App>();
builder.UseMauiCommunityToolkit(options =>
{
	options.SetShouldSuppressExceptionsInAnimations(true);
	options.SetShouldSuppressExceptionsInBehaviors(true);
	options.SetShouldSuppressExceptionsInConverters(true);
});
```

There are 3 new options available right now to prevent your application from crashing.

## SetShouldSuppressExceptionsInConverters

When set to true, if a converter is implementing `CommunityToolkit.Maui.Converters.BaseConverter` throws an `Exception`, the `Exception` will be caught and a predetermined default value will be returned. 

A default value can be set from both the `Convert` and `ConvertBack` methods using the `DefaultConvertReturnValue` and `DefaultConvertBackReturnValue` properties respectively.

```XML
<ContentPage.Resources>
    <SolidColorBrush x:Key="TrueColorBrush">Green</SolidColorBrush>
    <SolidColorBrush x:Key="FalseColorBrush">Red</SolidColorBrush>
    <mct:BoolToObjectConverter x:Key="BoolToColorBrushConverter" 
                                TrueObject="{StaticResource TrueColorBrush}" 
                                FalseObject="{StaticResource FalseColorBrush}"
                                DefaultConvertReturnValue="{StaticResource FalseColorBrush}"
                                DefaultConvertBackReturnValue="False"/>
</ContentPage.Resources>
```

## SetShouldSuppressExceptionsInAnimations

Similar to the `SetShouldSuppressExceptionsInConverters`, when set to true, if an `Animation` is implementing `CommunityToolkit.Maui.Behaviors.AnimationBehavior` throws an Exception, the Exception will be caught.

With this option, you don't need to worry about unexpected crashes of your application.

## SetShouldSuppressExceptionsInBehaviors

The last but not least option is for behaviors. When set to true, if a `Behavior` is implementing `CommunityToolkit.Maui.Behaviors.BaseBehavior` throws an `Exception`, the `Exception` will be caught.

## Release mode recommendation

All that settings are disabled by default. it happened because of back-compatibility and easier migration for Xamarin users.

It is definitely up to the developer, to enable or disable these options in the app, but I recommend the next code:

```csharp
var builder = MauiApp.CreateBuilder();
builder.UseMauiApp<App>();
#if DEBUG
builder.UseMauiCommunityToolkit();
#else
builder.UseMauiCommunityToolkit(options =>
{
	options.SetShouldSuppressExceptionsInAnimations(true);
	options.SetShouldSuppressExceptionsInBehaviors(true);
	options.SetShouldSuppressExceptionsInConverters(true);
});
#endif
```

In `Debug` we can enable all exceptions and notify the developer at the earliest stage if something goes wrong.

In all other cases, we should avoid application crashes and try to notify users in a friendlier form.

More details can be found on the [Microsoft Docs](https://learn.microsoft.com/en-us/dotnet/communitytoolkit/maui/get-started){target="_blank"}.

Happy coding without crashes and bugs!