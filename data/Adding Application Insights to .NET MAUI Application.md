Hello and warm greetings to the ever-evolving fraternity of developers.

The purpose of this article is to showcase the benefits of Application Insights over AppCenter, and guide you on how to integrate Application Insights into your .NET MAUI applications. But before getting started, let's discuss why do we need analyze our application.

.NET MAUI streamlines the development workflow, but it also fundamentally requires robust analytics to aid developers in understanding users’ interactions, diagnosing issues quickly, and continuously improving the application. And Microsoft's Application Insights can help you with that.

## Why Consider Application Insights over AppCenter?

AppCenter, Microsoft's solution for managing and monitoring applications, has long been the default choice for developers using Xamarin and is expected to be the same for .NET MAUI. However, Application Insights holds an arguably superior edge with a wide range of features, including advanced application analytics, user interaction tracking, performance monitoring, and more.

## Integrating Application Insights with .NET MAUI

Adding Application Insights to your .NET MAUI application doesn't require an extensive process. Follow the steps below:

### 1. Setting Up on Azure Portal

Before implementing Application Insights in your application, create an Application Insights resource in the Azure portal.

- Navigate to the Azure portal and create a new resource.
- From the 'New' window, search for "Application Insights", select it and press "Create".
- Enter your desired details and press "Review + Create", then "Create" again.

This new resource will generate a Connection string, which is essential when setting up Application Insights in your .NET MAUI app.

### 2. Install the ApplicationInsights SDK

The next step would be installing the ApplicationInsights SDK in your .NET MAUI solution. Open the Nuget Package Manager and look for 'Microsoft.Extensions.Logging.ApplicationInsights'. Install this package into your solution.

```xml
<PackageReference Include="Microsoft.Extensions.Logging.ApplicationInsights" Version="2.22.0-beta3" />
```

### 3. Initialize Application Insights

Initialize this client in your app, using the Connection string obtained from the Azure portal.

Initial setup could look like this:

```csharp
builder.Logging.AddApplicationInsights(configuration =>
{
    configuration.TelemetryInitializers.Add(new ApplicationInitializer());
    configuration.ConnectionString = "YOUR-CONNECTION-STRING;
}, options =>
{
    options.IncludeScopes = true;
});
```

### 4. Include additional properties

To track session of specific user, you can include additional information in logs. To do that implement `ITelemetryInitializer`:

```csharp
public class ApplicationInitializer : ITelemetryInitializer
{
	public string SessionId { get; } = Guid.NewGuid().ToString();
	public string? DeviceOperationSystem { get; } = DeviceInfo.Current.Platform.ToString();
	public string DeviceOemName { get; } = DeviceInfo.Current.Manufacturer;
	public string DeviceModel { get; } = DeviceInfo.Current.Model;
	public string ComponentVersion { get; } = AppInfo.Current.VersionString;

	public void Initialize(ITelemetry telemetry)
	{
		telemetry.Context.Session.Id = SessionId;
		telemetry.Context.Device.OperatingSystem = DeviceOperationSystem;
		telemetry.Context.Device.OemName = DeviceOemName;
		telemetry.Context.Device.Model = DeviceModel;
		telemetry.Context.Component.Version = ComponentVersion;
	}
}
```

### 5. Track Events, Exceptions and Dependencies

Now, with Application Insights initialized, one can easily track events, exceptions and dependencies.

An example of how to track an event:

```csharp
private readonly ILogger<MyService> logger;

public MyService(ILogger<MyService> logger)
{
    this.logger = logger;
}

public void MyAction(string parameter)
{
    logger.LogInformation("My action executed with parameter: {Parameter}", parameter);
}
```

To track an exception:

```csharp
try
{
    ...
}
catch (Exception ex)
{
    logger.LogError(ex, "Something went wrong");
}
```

## Conclusion

As we ponder over the ongoing debate between Application Insights and AppCenter, the focus is to find a tool, not only suitable for analytics and diagnosing issues, but also one that provides seamless integration with the development process. Application Insights' flexibility and adaptability could very well make it a preferred choice for developers with .NET MAUI applications.

It provides powerful insights and monitoring in near real-time, pushing it ahead in the race. Providing quick access to rich analytics, Application Insights is a tool acting as an 'AppCenter Killer'. It's a brave, new world for .NET MAUI apps, where Application Insights is the analytics option worth considering!

![Application insights](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/46/appinsights.png)

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/MauiApplicationInsights){target="_blank"}.