Hello!

In this article, we will discuss how to implement real-time live tracking using .NET MAUI for Android, iOS, and Windows platforms.

`.NET MAUI` already has a mechanism to get location. There is a method `GetLocationAsync`:

```csharp
Location location = await Geolocation.Default.GetLocationAsync(request, CancellationToken.None);
```

Let's extend this API. Starting from the interface:

```csharp
public interface IGeolocator
{
	Task StartListening(IProgress<Location> positionChangedProgress, CancellationToken cancellationToken);
}
```
where `positionChangedProgress` contains the geolocation when position changes, `cancallationToken` is used for stopping the process.

## Android

Geolocation requires additional permissions, so add these lines to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-feature android:name="android.hardware.location" android:required="false" />
<uses-feature android:name="android.hardware.location.gps" android:required="false" />
<uses-feature android:name="android.hardware.location.network" android:required="false" />
<queries>
    <intent>
        <action android:name="android.intent.action.VIEW" />
        <data android:scheme="geo"/>
    </intent>
</queries>
```

Now let's implement our `IGeolocator` interface:

```csharp
public class GeolocatorImplementation : IGeolocator
{
	GeolocationContinuousListener? locator;

	public async Task StartListening(IProgress<Microsoft.Maui.Devices.Sensors.Location> positionChangedProgress, CancellationToken cancellationToken)
	{
		var permission = await Permissions.CheckStatusAsync<Permissions.LocationAlways>();
		if (permission != PermissionStatus.Granted)
		{
			permission = await Permissions.RequestAsync<Permissions.LocationAlways>();
			if (permission != PermissionStatus.Granted)
			{
				await Toast.Make("No permission").Show(CancellationToken.None);
				return;
			}
		}

		locator = new GeolocationContinuousListener();
		var taskCompletionSource = new TaskCompletionSource();
		cancellationToken.Register(() =>
		{
			locator.Dispose();
			locator = null;
			taskCompletionSource.TrySetResult();
		});
		locator.OnLocationChangedAction = location =>
			positionChangedProgress.Report(
				new Microsoft.Maui.Devices.Sensors.Location(location.Latitude, location.Longitude));
		await taskCompletionSource.Task;
	}
}

internal class GeolocationContinuousListener : Java.Lang.Object, ILocationListener
{
	public Action<Location>? OnLocationChangedAction { get; set; }

	LocationManager? locationManager;

	public GeolocationContinuousListener()
	{
		locationManager = (LocationManager?)Android.App.Application.Context.GetSystemService(Android.Content.Context.LocationService);
		locationManager?.RequestLocationUpdates(LocationManager.GpsProvider, 1000, 0, this);
	}

	public void OnLocationChanged(Location location)
	{
		OnLocationChangedAction?.Invoke(location);
	}

	public void OnProviderDisabled(string provider)
	{
	}

	public void OnProviderEnabled(string provider)
	{
	}

	public void OnStatusChanged(string? provider, [GeneratedEnum] Availability status, Bundle? extras)
	{
	}

	protected override void Dispose(bool disposing)
	{
		base.Dispose(disposing);
		locationManager?.RemoveUpdates(this);
		locationManager?.Dispose();
	}
}
```

`GeolocationContinuousListener` requests location updates from `LocationManager`.

## iOS/MacCatalyst

LocationManager requires access to a location, so add these lines to `Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs access to location when open.</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>This app needs access to location when in the background.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app needs access to location when open and in the background.</string>
<key>UIBackgroundModes</key>
<array>
    <string>location</string>
</array>
```

Now let's implement our `IGeolocator` interface:

```csharp
public class GeolocatorImplementation : IGeolocator
{
	readonly CLLocationManager manager = new();

	public async Task StartListening(IProgress<Location> positionChangedProgress, CancellationToken cancellationToken)
	{
		var permission = await Permissions.CheckStatusAsync<Permissions.LocationAlways>();
		if (permission != PermissionStatus.Granted)
		{
			permission = await Permissions.RequestAsync<Permissions.LocationAlways>();
			if (permission != PermissionStatus.Granted)
			{
				await Toast.Make("No permission").Show(CancellationToken.None);
				return;
			}
		}
		var taskCompletionSource = new TaskCompletionSource();
		cancellationToken.Register(() =>
		{
			manager.LocationsUpdated -= PositionChanged;
			taskCompletionSource.TrySetResult();
		});
		manager.LocationsUpdated += PositionChanged;

		void PositionChanged(object? sender, CLLocationsUpdatedEventArgs args)
		{
			if (args.Locations.Length > 0)
			{
				var coordinate = args.Locations[^1].Coordinate;
				positionChangedProgress.Report(new Location(coordinate.Latitude, coordinate.Longitude));
			}
		}

		await taskCompletionSource.Task;
	}
}
```

Similar to `Android` here we also create `CLLocationManager` and subscribe to `LocationsUpdated`.

## Windows

The same as with `Android` and `iOS` we implement `IGeolocator` interface:

```csharp
public class GeolocatorImplementation : IGeolocator
{
	readonly Windows.Devices.Geolocation.Geolocator locator = new();

	public async Task StartListening(IProgress<Location> positionChangedProgress, CancellationToken cancellationToken)
	{
		var taskCompletionSource = new TaskCompletionSource();
		cancellationToken.Register(() =>
		{
			locator.PositionChanged -= PositionChanged;
			taskCompletionSource.TrySetResult();
		});
		locator.PositionChanged += PositionChanged;

		void PositionChanged(Windows.Devices.Geolocation.Geolocator sender, PositionChangedEventArgs args)
		{
			positionChangedProgress.Report(new Location(args.Position.Coordinate.Latitude, args.Position.Coordinate.Longitude));
		}

		await taskCompletionSource.Task;
	}
}
```

## Sample

And the most pleasant step to check that everything works:

```csharp
var progress = new Progress<Location>(location =>
{
    LocationText = $"New location: {location.Latitude}, {location.Longitude}";
});
await Geolocator.Default.StartListening(progress, cancellationToken);
```

![Android real-time location tracker](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/39/android.gif)

## Conclusion

In this article, we have learned how to implement real-time live tracking using .NET MAUI for Android, iOS, and Windows platforms. With a single code base, we can easily access device location with real-time tracking features.

Make sure to always handle location data responsibly and obtain the necessary permissions from your users before accessing and displaying their location data. Additionally, consider optimizing the location update interval and platform-specific configurations to improve battery life and performance.

The final code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/MauiMaps){target="_blank"}.

Happy coding!