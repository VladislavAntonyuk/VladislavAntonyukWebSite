Привіт! Bonjour! Hello!

`.NET MAUI`, `CommunityToolkit.MAUI`, and `CommunityToolkit.MAUI.Markup` have been released so it’s time to migrate your old Xamarin application!

A lot of applications support different languages to provide users with the best experience using their native language. Depending on your needs, there are several approaches to localizing the .NET MAUI program.

`.NET MAUI` like other .NET applications uses the `Resources` files to store strings, images, and other files.

![.NET MAUI App Resources](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/20/mauilocalization-1.png)

Let’s add 2 new resource files `AppResources.resx` and `AppResources.uk.resx`. The first file contains default application localized resources. In our case it’s English. The second file contains resources for the Ukrainian language.

First of all, we need to import the namespace of our resources.

```xml
xmlns:localization="clr-namespace:MauiLocalization.Resources.Localization"
```

Then we can set  MainPage Title with:

```xml
Title = {x:Static localization:AppResources.MainPageTitle}
```

Also, add this line to your csproj file:

```xml
<GenerateSatelliteAssembliesForCore>true</GenerateSatelliteAssembliesForCore>
```

> You can read more about Satellite assemblies here: [Create satellite assemblies for .NET apps
](https://docs.microsoft.com/en-us/dotnet/core/extensions/create-satellite-assemblies).

Now if you start your application you will see the default title content - "Main page". Switch to the Ukrainian language and restart the app. Now the title content is "Головна сторінка".

It works great, but what if I do not want to restart the app or I want to change the language only for this application?

In that case, we need to add some code. We need to notify our property that the resource is changed. For that we create `LocalizationResourceManager`:

```csharp
public class LocalizationResourceManager : INotifyPropertyChanged
{
	private LocalizationResourceManager()
	{
		AppResources.Culture = CultureInfo.CurrentCulture;
	}

	public static LocalizationResourceManager Instance { get; } = new();

	public object this[string resourceKey] => AppResources.ResourceManager.GetObject(resourceKey, AppResources.Culture) ?? Array.Empty<byte>();

	public event PropertyChangedEventHandler? PropertyChanged;

	public void SetCulture(CultureInfo culture)
	{
		AppResources.Culture = culture;
		PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(null));
	}
}
```

Now your `Title` value can be updated to this:

```xml
Title = "{Binding MyCodeBehindLocalizationResourceManager[MainPageTitle], Mode=OneWay}"
```

where `MyCodeBehindLocalizationResourceManager` is a code-behind property with value `LocalizationResourceManager.Instance`.

So here the `Title` value is binding to the resource value. Each time we call the method `LocalizationResourceManager.SetCulture`, our property value is updated.

If you don't want to create an additional property for `LocalizationResourceManager`, we can hide it in `MarkupExtension`:

```csharp
[ContentProperty(nameof(Name))]
public class TranslateExtension : IMarkupExtension<BindingBase>
{
	public string? Name { get; set; }

	public BindingBase ProvideValue(IServiceProvider serviceProvider)
	{
		return new Binding
		{
			Mode = BindingMode.OneWay,
			Path = $"[{Name}]",
			Source = LocalizationResourceManager.Instance
		};
	}

	object IMarkupExtension.ProvideValue(IServiceProvider serviceProvider)
	{
		return ProvideValue(serviceProvider);
	}
}
```

Now, the `Title` value can be updated to:

```xml
Title="{localization:Translate MainPageTitle}"
```

As a result, you should receive such app:

![.NET MAUI Localization](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/20/MauiLocalization.gif)

That’s all you need to switch the language without restarting the app.

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/MauiLocalization){target="_blank"}.

Happy coding!