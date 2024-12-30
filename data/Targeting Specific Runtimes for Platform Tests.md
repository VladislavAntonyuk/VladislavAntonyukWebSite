Hello! 👋

In the [previous article](https://vladislavantonyuk.github.io/articles/Testing-.NET-MAUI-Application-using-Appium-and-xUnit/), we discussed how to set up and run tests for your .NET MAUI application. The tests are shared for all platforms, but what if you need to test your application against a specific runtime version or environment? Here's how to achieve targeted testing for your platform interactions.

## Step 1. Define Runtime and platform

Create a class `RuntimePlatform`:

```csharp
public class RuntimePlatform
{
    public const string WindowsAndroid = "WINDOWS,Android";
    public const string OsxAndroid = "OSX,Android";
    public const string OsxIOs = "OSX,iOS";
    public const string OsxMacCatalyst = "OSX,MacCatalyst";
    public const string WindowsWindows = "WINDOWS,Windows";
    public const string OsxTizen = "OSX,Tizen";

    public static RuntimePlatform Parse(string runtimePlatform)
    {
        var data = runtimePlatform.Split(',');
        return new RuntimePlatform
        {
            Runtime = OSPlatform.Create(data[0]),
            Platform = data[1]
        };
    }

    public string? Platform { get; private init; }

    public OSPlatform Runtime { get; private init; }
}
```

Here we define constants for all pairs of Runtime and Platform we need for tests. For example, we want to run Android app tests on Windows and OSX, but Tizen only on OSX.

## Step 2. Create an attribute

For tests, I use `xUnit`. To define the test we need to set the `Fact` attribute for the test method. But as we want to skip the test on some platforms, we need to extend the `Fact` attribute.

Create a new class `AllowOnPlatformFactAttribute`:

```csharp
public sealed class AllowOnPlatformFactAttribute : FactAttribute
{
    public AllowOnPlatformFactAttribute(params string[] runtimePlatforms)
    {
        foreach (var runtimePlatformString in runtimePlatforms)
        {
            var runtimePlatform = RuntimePlatform.Parse(runtimePlatformString);
            if (RuntimeInformation.IsOSPlatform(runtimePlatform.Runtime) && AppiumSetup.Platform == runtimePlatform.Platform)
            {
                Skip = null;
                return;
            }

            Skip = $"Test cannot be executed only on the {runtimePlatformString} platform";
        }
    }
}
```

This attribute checks if the current runtime and platform match the defined attribute parameter. If the condition is false, the test is skipped.

## Step 3. Apply the attribute

The final step is to replace `Fact` attribute with `AllowOnPlatformFact` attribute, so our launch test looks like this:

```csharp
[AllowOnPlatformFact(
    RuntimePlatform.WindowsAndroid,
    RuntimePlatform.OsxAndroid,
    RuntimePlatform.OsxIOs,
    RuntimePlatform.OsxMacCatalyst,
    RuntimePlatform.WindowsWindows,
    RuntimePlatform.OsxTizen
)]
public async Task AppLaunches()
{
    await Task.Delay(2000);
    VerifyScreenshot($"{nameof(AppLaunches)}");
}
```

# Conclusion

By implementing targeted platform tests, you gain several advantages:
- Increased Confidence: You can ensure your application functions correctly across various runtime environments, boosting overall confidence in its robustness.
- Improved Efficiency: By focusing tests on specific runtimes, you can reduce overall test execution time, leading to faster development cycles.
- Simplified Maintenance: Documented runtime configurations make it easier to maintain and update your test suite as your application and supported platforms evolve.

Happy testing!