Hello!

While the whole world is waiting for Ukraine's victory in the **war** against Russia, `.NET MAUI GA` is coming closer. A lot of developers started creating new apps or migrating their old apps from `Xamarin.Forms` to `.NET MAUI`.

The first impression is very important. The application should have a good-looking UI and a user-friendly experience. But some applications may have complex features, that require additional tutorials for the general user.

In this article, I will show you how to create an interactive app tutorial in `.NET MAUI` using `CommunityToolkit.Maui Popup`.

First of all, create a new `.NET MAUI` application and install the `CommunityToolkit.Maui` NuGet package.
![MAUI CommunityToolkit NuGet package](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/19/mct-nuget.png)
`CommunityToolkit.Maui` `Preview 8` brings the first control with the new Handler architecture - `Popup`. It overlays over the current application page and allows it to show any `View` content. We will use it as a container for our tutorial.

`Popup` requires `NavigationStack`, so we need to put our `MainPage` inside a `NavigationPage`. Update `App.xaml.cs` with the next code:
```csharp
MainPage = new NavigationPage(new MauiPage());
```

Now, let's create a new Popup:
```xml
<?xml version="1.0" encoding="utf-8" ?>
<mct:Popup xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
           xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
           xmlns:mct="http://schemas.microsoft.com/dotnet/2022/maui/toolkit"
           x:Class="TutorialHelp.MyPopup"
           Color="Transparent">

	<Grid RowDefinitions="96, *">
		<HorizontalStackLayout Grid.Row="0" HorizontalOptions="End">
			<Label Text="Open help" VerticalOptions="Center"/>
			<Rectangle WidthRequest="55" HeightRequest="55"  Opacity="0.5" />
		</HorizontalStackLayout>
		<VerticalStackLayout Grid.Row="1">
			<Rectangle WidthRequest="90" HeightRequest="40" Opacity="0.5"  HorizontalOptions="Center"/>
			<Label Text="By clicking this magic button you can increment the counter"  HorizontalOptions="Center"/>
		</VerticalStackLayout>
	</Grid>

</mct:Popup>
```

The idea is pretty simple. We make a transparent popup and put our tips over the main components.

When our popup is ready, we can display it on our main page. Add the next method and call it when you need it:
```csharp
void ShowPopup()
{
    var simplePopup = new MyPopup();
    this.ShowPopup(simplePopup);
}
```

To show the popup at the start of the application you have to call it after Handler initialization. For example:
```csharp
protected override void OnHandlerChanged()
{
	base.OnHandlerChanged();
	ShowPopup();
}
```

After all these simple steps you should see the next result:
![MAUI Popup](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/19/simple-popup.png)

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/TutorialHelp){target="_blank"}.

Thank you for reading!