Hello!

.NET MAUI's next major release is closer and closer. It brings a lot of bug fixes and new features. One of them is Maps control.

This article is devoted to the customization of standard map pins. We want to display a custom image instead of a standard pin icon.

Let's start!

## Precondition

Start with installing NuGet package:

 ```xml
 <PackageReference Include="Microsoft.Maui.Controls.Maps" Version="7.0.59"/>
 ```

## Custom Pin

First of all, we need to create a new control:

```csharp
public class CustomPin : Pin
{
	public static readonly BindableProperty ImageSourceProperty = BindableProperty.Create(nameof(ImageSource), typeof(ImageSource), typeof(CustomPin);

	public ImageSource? ImageSource
	{
		get => (ImageSource?)GetValue(ImageSourceProperty);
		set => SetValue(ImageSourceProperty, value);
	}
}
```

This control has a bindable property `ImageSource` that allows us to choose any image source to store our pin icon.

## Customize pin on Android

To be able to add, update, and remove map elements we need to store them in memory. To do that, let's create a `CustomMapHandler`:

```csharp
public class CustomMapHandler : MapHandler
{
	public static readonly IPropertyMapper<IMap, IMapHandler> CustomMapper =
		new PropertyMapper<IMap, IMapHandler>(Mapper)
		{
			[nameof(IMap.Pins)] = MapPins,
		};

	public CustomMapHandler() : base(CustomMapper, CommandMapper)
	{
	}

	public CustomMapHandler(IPropertyMapper? mapper = null, CommandMapper? commandMapper = null) : base(
		mapper ?? CustomMapper, commandMapper ?? CommandMapper)
	{
	}

	public List<Marker> Markers { get; } = new();

	protected override void ConnectHandler(MapView platformView)
	{
		base.ConnectHandler(platformView);
		var mapReady = new MapCallbackHandler(this);
		PlatformView.GetMapAsync(mapReady);
	}

	private static new void MapPins(IMapHandler handler, IMap map)
	{
		if (handler is CustomMapHandler mapHandler)
		{
			foreach (var marker in mapHandler.Markers)
			{
				marker.Remove();
			}
			
			mapHandler.AddPins(map.Pins);
		}
	}

	private void AddPins(IEnumerable<IMapPin> mapPins)
	{
		if (Map is null || MauiContext is null)
		{
			return;
		}

		foreach (var pin in mapPins)
		{
			var pinHandler = pin.ToHandler(MauiContext);
			if (pinHandler is IMapPinHandler mapPinHandler)
			{
				var markerOption = mapPinHandler.PlatformView;
				if (pin is CustomPin cp)
				{
					cp.ImageSource.LoadImage(MauiContext, result =>
					{
						if (result?.Value is BitmapDrawable bitmapDrawable)
						{
							markerOption.SetIcon(BitmapDescriptorFactory.FromBitmap(bitmapDrawable.Bitmap));
						}

						AddMarker(Map, pin, Markers, markerOption);
					});
				}
				else
				{
					AddMarker(Map, pin, Markers, markerOption);
				}
			}
		}
	}

	private static void AddMarker(GoogleMap map, IMapPin pin, List<Marker> markers, MarkerOptions markerOption)
	{
		var marker = map.AddMarker(markerOption);
		pin.MarkerId = marker.Id;
		markers.Add(marker);
	}
}
```

The next step is notifying the handler that our pins are updated. We should do it when the map is ready:

```csharp
class MapCallbackHandler : Java.Lang.Object, IOnMapReadyCallback
{
	private readonly IMapHandler mapHandler;

	public MapCallbackHandler(IMapHandler mapHandler)
	{
		this.mapHandler = mapHandler;
	}

	public void OnMapReady(GoogleMap googleMap)
	{
		mapHandler.UpdateValue(nameof(IMap.Pins));
	}
}
```

## Customize pin on iOS/MacCatalyst

iOS/MacCatalyst requires a bit more customization.

First, we need to create a new class `CustomAnnotation`. It stores an `UIImage` of our pin icon.

```csharp
public class CustomAnnotation : MKPointAnnotation
{
	public Guid Identifier { get; init; }
	public UIImage? Image { get; init; }
	public required IMapPin Pin { get; init; }
}
```

Then create the `CustomMapHandler`:

```csharp
public class CustomMapHandler : MapHandler
{
	private static UIView? lastTouchedView;
	public static readonly IPropertyMapper<IMap, IMapHandler> CustomMapper =
		new PropertyMapper<IMap, IMapHandler>(Mapper)
		{
			[nameof(IMap.Pins)] = MapPins,
		};

	public CustomMapHandler() : base(CustomMapper, CommandMapper)
	{
	}

	public CustomMapHandler(IPropertyMapper? mapper = null, CommandMapper? commandMapper = null) : base(
		mapper ?? CustomMapper, commandMapper ?? CommandMapper)
	{
	}

	public List<IMKAnnotation> Markers { get; } = new();

	protected override void ConnectHandler(MauiMKMapView platformView)
	{
		base.ConnectHandler(platformView);
		platformView.GetViewForAnnotation += GetViewForAnnotations;
	}

	private static void OnCalloutClicked(IMKAnnotation annotation)
	{
		var pin = GetPinForAnnotation(annotation);
		if (lastTouchedView is MKAnnotationView)
			return;
		pin?.SendInfoWindowClick();
	}

	private static MKAnnotationView GetViewForAnnotations(MKMapView mapView, IMKAnnotation annotation)
	{
		MKAnnotationView annotationView;
		if (annotation is CustomAnnotation customAnnotation)
		{
			annotationView = mapView.DequeueReusableAnnotation(customAnnotation.Identifier.ToString()) ??
							 new MKAnnotationView(annotation, customAnnotation.Identifier.ToString());
			annotationView.Image = customAnnotation.Image;
			annotationView.CanShowCallout = true;
		}
		else if (annotation is MKPointAnnotation)
		{
			annotationView = mapView.DequeueReusableAnnotation("defaultPin") ??
							 new MKMarkerAnnotationView(annotation, "defaultPin");
			annotationView.CanShowCallout = true;
		}
		else
		{
			annotationView = new MKUserLocationView(annotation, null);
		}

		var result = annotationView ?? new MKAnnotationView(annotation, null);
		AttachGestureToPin(result, annotation);
		return result;
	}

	static void AttachGestureToPin(MKAnnotationView mapPin, IMKAnnotation annotation)
	{
		var recognizers = mapPin.GestureRecognizers;

		if (recognizers != null)
		{
			foreach (var r in recognizers)
			{
				mapPin.RemoveGestureRecognizer(r);
			}
		}

		var recognizer = new UITapGestureRecognizer(g => OnCalloutClicked(annotation))
		{
			ShouldReceiveTouch = (gestureRecognizer, touch) =>
			{
				lastTouchedView = touch.View;
				return true;
			}
		};

		mapPin.AddGestureRecognizer(recognizer);
	}

	static IMapPin? GetPinForAnnotation(IMKAnnotation? annotation)
	{
		if (annotation is CustomAnnotation customAnnotation)
		{
			return customAnnotation.Pin;
		}

		return null;
	}

	private static new void MapPins(IMapHandler handler, IMap map)
	{
		if (handler is CustomMapHandler mapHandler)
		{
			foreach (var marker in mapHandler.Markers)
			{
				mapHandler.PlatformView.RemoveAnnotation(marker);
			}

			mapHandler.Markers.Clear();
			mapHandler.AddPins(map.Pins);
		}
	}

	private void AddPins(IEnumerable<IMapPin> mapPins)
	{
		if (MauiContext is null)
		{
			return;
		}

		foreach (var pin in mapPins)
		{
			var pinHandler = pin.ToHandler(MauiContext);
			if (pinHandler is IMapPinHandler mapPinHandler)
			{
				var markerOption = mapPinHandler.PlatformView;
				if (pin is CustomPin cp)
				{
					cp.ImageSource.LoadImage(MauiContext, result =>
					{
						markerOption = new CustomAnnotation()
						{
							Identifier = cp.Id,
							Image = result?.Value,
							Title = pin.Label,
							Subtitle = pin.Address,
							Coordinate = new CLLocationCoordinate2D(pin.Location.Latitude, pin.Location.Longitude),
							Pin = cp
						};

						AddMarker(PlatformView, pin, Markers, markerOption);
					});
				}
				else
				{
					AddMarker(PlatformView, pin, Markers, markerOption);
				}
			}
		}
	}

	private static void AddMarker(MauiMKMapView map, IMapPin pin, List<IMKAnnotation> markers, IMKAnnotation annotation)
	{
		map.AddAnnotation(annotation);
		pin.MarkerId = annotation;
		markers.Add(annotation);
	}
}
```

It's responsible for loading images and adding an annotation to the map. Later, when annotation should be displayed, the `GetViewForAnnotations` gets the annotation view and displays it on map.

The final step is registering our handlers:

```csharp
public static class MauiProgram
{
	public static MauiApp CreateMauiApp()
	{
		var builder = MauiApp.CreateBuilder();
		builder.UseMauiApp<App>().UseMauiMaps();
		builder.ConfigureMauiHandlers(handlers =>
		{
#if ANDROID || IOS || MACCATALYST
			handlers.AddHandler<Microsoft.Maui.Controls.Maps.Map, CustomMapHandler>();
#endif
		});

		return builder.Build();
	}
}
```

That's all we need to customize .NET MAUI Map pins. Run the application and see the result:

![.NET MAUI Custom pins](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/30/android-pins.png)

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/MauiMaps){target="_blank"}.

Happy coding!
