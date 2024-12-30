Hello! 👋

As we delve into the realm of unit testing and integration testing for .NET MAUI applications on this unique February 29th, 2024, it's essential to acknowledge the significance of ensuring the robustness and reliability of our code.

In this article, we'll explore the fundamentals of unit testing and integration testing for .NET MAUI applications, providing practical insights and examples to guide you in setting up and writing tests effectively. Whether you're familiar with test-driven development or looking to enhance your testing practices, let's embark on this journey of ensuring the quality and resilience of your .NET MAUI projects.

Now, let's continue with the main content, incorporating examples of setting up and writing tests for .NET MAUI applications.

# Unit Testing in .NET MAUI

In .NET MAUI development, unit testing plays a crucial role in ensuring the reliability and functionality of individual units of code. As a .NET software engineer using C#, you are likely familiar with xUnit, a popular unit testing framework. Here are awesome videos demonstrating step-by-step guides to set and write unit tests for your application:

[![YouTube Video Link](https://learn.microsoft.com/video/media/6c225cf7-1199-4329-accb-c1b31b54ed67/PR10_dotNETconf-AllanRitchie-1920x1080_w1120.png)](https://learn.microsoft.com/en-us/shows/dotnetconf-focus-on-maui/unit-testing-for-your-maui-applications)

[![YouTube Video Link](https://img.youtube.com/vi/C9vIDLQwc7M/0.jpg)](https://www.youtube.com/watch?v=C9vIDLQwc7M)


# UI Testing in .NET MAUI

UI testing is crucial for ensuring that various parts of your .NET MAUI application work seamlessly together. As we step into the realm of mobile application testing, one tool that stands out for its versatility and effectiveness is Appium.

Appium is an open-source and cross-platform mobile application automation tool that supports all .NET MAUI platforms. What sets Appium apart is its commitment to providing a single automation API that works across different mobile platforms, making it a preferred choice for those seeking a unified approach to mobile testing.

Install Appium and drivers for each platform:

```bash
npm i --location=global appium@2.1.1
appium driver install uiautomator2@2.29.4
appium driver install --source=npm appium-windows-driver@2.10.1
appium driver install xcuitest@4.34.0
appium driver install mac2@1.7.2
```

For UI integration tests using Appium, create a new xUnit project for each platform.

For Android, your csproj may look like this:

```xml
<Project Sdk="Microsoft.NET.Sdk">

    <PropertyGroup>
        <TargetFramework>net8.0</TargetFramework>
        <IsPackable>false</IsPackable>

        <RootNamespace>Client.UITests</RootNamespace>
    </PropertyGroup>

    <ItemGroup>
        <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.9.0" />
        <PackageReference Include="xunit" Version="2.7.0" />
        <PackageReference Include="xunit.analyzers" Version="1.11.0">
            <PrivateAssets>all</PrivateAssets>
            <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
        </PackageReference>
        <PackageReference Include="xunit.runner.visualstudio" Version="2.5.7">
            <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
            <PrivateAssets>all</PrivateAssets>
        </PackageReference>
        <PackageReference Include="coverlet.collector" Version="6.0.0">
            <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
            <PrivateAssets>all</PrivateAssets>
        </PackageReference>
    </ItemGroup>

    <ItemGroup>
        <PackageReference Include="Appium.WebDriver" Version="5.0.0-rc.5" />
        <PackageReference Include="VisualTestUtils.MagickNet" Version="0.9.46-beta" />
        <PackageReference Include="AndroidSdk" Version="0.9.0" /> <!-- only for Android csproj-->
    </ItemGroup>

    <ItemGroup>
        <Compile Include="..\Client.Shared.UITests\**\*.cs" LinkBase="Shared" Visible="true" />
    </ItemGroup>

    <ItemGroup>
      <None Update="snapshots\Android\*.png"> <!-- replace Android with your platform-->
        <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
      </None>
    </ItemGroup>

</Project>
```

The next step is preparing the AppiumSetup for each platform.

I try to make the test as much independent from user interaction, so it can be executed on CI.

Android AppiumSetup class creates an Android Emulator and installs the APK file on it.

```csharp
namespace Client.UITests;

using AndroidSdk;
using OpenQA.Selenium.Appium;
using OpenQA.Selenium.Appium.Android;

public sealed class AppiumSetup : IDisposable
{
    private readonly ITestOutputHelper testOutputHelper;
    public const string Platform = "Android";
    private const string AvdName = "CI_Emulator";
    private const string PackageName = "com.vladislavantonyuk.drawgo";

    private readonly AppiumServiceHelper appiumService;
    private readonly Emulator.AndroidEmulatorProcess emulatorProcess;

    public AppiumDriver App { get; }

    public AppiumSetup(ITestOutputHelper testOutputHelper)
    {
        this.testOutputHelper = testOutputHelper;
        var sdk = InstallSoftware();
        emulatorProcess = sdk.Emulator.Start(AvdName, new Emulator.EmulatorStartOptions { NoSnapshot = true });
        emulatorProcess.WaitForBootComplete();

        appiumService = new AppiumServiceHelper();
        appiumService.StartAppiumLocalServer();

        var options = new AppiumOptions
        {
            AutomationName = "UIAutomator2",
            PlatformName = Platform,
            PlatformVersion = "13",
            App = GetApp()
        };

        App = new AndroidDriver(options);
    }

    public void Dispose()
    {
        App.Quit();
        emulatorProcess.Shutdown();
        appiumService.Dispose();
    }

    private static AndroidSdkManager InstallSoftware()
    {
        const string avdSdkId = "system-images;android-33;google_apis_playstore;x86_64";

        var sdkPackages = new[]
        {
            "platforms;android-33"
        };

        var sdk = new AndroidSdkManager();
        sdk.Acquire();
        sdk.SdkManager.Install(sdkPackages);
        sdk.SdkManager.Install(avdSdkId);
        if (sdk.AvdManager.ListAvds().All(x => x.Name != AvdName))
        {
            sdk.AvdManager.Create(AvdName, avdSdkId, "pixel", force: true);
        }
        
        return sdk;
    }

    private string GetApp()
    {
        var path = "YOUR-FULL-PATH-TO-SIGNED-APK";
        testOutputHelper.WriteLine(path);
        return path;
    }
}
```

For all other platforms the `AppiumSetup` classes can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/MauiTests){target="_blank"}.

Pay attention to Windows setup. You need to start the application manually or use `process = Process.Start("explorer.exe", "YOUR-APP-IDENTIFIER:");`, Appium doesn't start WinUI application automatically.

That's it with setting platform-specific code. The next part is Shared for all platforms.

Create a folder "Client.Shared.UITests". This is where we will store our tests and helper classes.

Create an `AppiumServiceHelper` class. It creates and executes `AppiumLocalService`.

```csharp
namespace Client.UITests;

using OpenQA.Selenium.Appium.Service;

public sealed class AppiumServiceHelper : IDisposable
{
    private const string DefaultHostAddress = "127.0.0.1";
    private const int DefaultHostPort = 4723;

    private readonly AppiumLocalService appiumLocalService;

    public AppiumServiceHelper(string host = DefaultHostAddress, int port = DefaultHostPort)
    {
        var builder = new AppiumServiceBuilder()
                      .WithIPAddress(host)
                      .UsingPort(port);

        appiumLocalService = builder.Build();
    }

    public void StartAppiumLocalServer()
    {
        if (appiumLocalService.IsRunning)
        {
            return;
        }
        
        appiumLocalService.Start();
    }

    public void Dispose()
    {
        appiumLocalService.Dispose();
    }
}
```

Create a base class for all tests:

```csharp
namespace Client.UITests;

using System.Globalization;
using System.Runtime.InteropServices;
using OpenQA.Selenium.Appium;
using OpenQA.Selenium.Appium.Windows;
using VisualTestUtils;
using VisualTestUtils.MagickNet;

public abstract class BaseTest(ITestOutputHelper testOutputHelper) : IAsyncLifetime
{
    private const double DifferenceThreshold = 1 / 100d; // 1% difference
    private readonly VisualRegressionTester visualRegressionTester = new(testRootDirectory: Environment.CurrentDirectory,
                                                                          visualComparer: new MagickNetVisualComparer(differenceThreshold: DifferenceThreshold),
                                                                          visualDiffGenerator: new MagickNetVisualDiffGenerator(),
                                                                          ciArtifactsDirectory: Environment.GetEnvironmentVariable("Build.ArtifactStagingDirectory"));
    private readonly MagickNetImageEditorFactory imageEditorFactory = new();

    protected AppiumDriver App { get; } = new AppiumSetup(testOutputHelper).App;

    protected AppiumElement FindUiElement(string id)
    {
        return App.FindElement(App is WindowsDriver ? MobileBy.AccessibilityId(id) : MobileBy.Id(id));
    }

    public Task InitializeAsync()
    {
        return Task.CompletedTask;
    }

    public Task DisposeAsync()
    {
        App.Dispose();
        return Task.CompletedTask;
    }

    protected void VerifyScreenshot(string name)
    {
        if (App.PlatformName == "Windows")
        {
            var handle = App.CurrentWindowHandle;
            MoveWindow(IntPtr.Parse(handle[2..], NumberStyles.HexNumber), 0, 0, 800, 600, true);
        }
        
        var screenshotPngBytes = App.GetScreenshot().AsByteArray;

        var actualImage = new ImageSnapshot(screenshotPngBytes, ImageSnapshotFormat.PNG);

        // For Android and iOS, crop off the OS status bar at the top since it's not part of the
        // app itself and contains the time, which always changes. For WinUI, crop off the title
        // bar at the top as it varies slightly based on OS theme and is also not part of the app.
        int cropFromTop = App.PlatformName switch
        {
            "Android" => 60,
            "iOS" => 90,
            "Windows" => 32,
            _ => 0,
        };

        // For Android also crop the 3 button nav from the bottom, since it's not part of the
        // app itself and the button color can vary (the buttons change clear briefly when tapped)
        int cropFromBottom = App.PlatformName switch
        {
            "Android" => 125,
            _ => 0,
        };

        if (cropFromTop > 0 || cropFromBottom > 0)
        {
            IImageEditor imageEditor = imageEditorFactory.CreateImageEditor(actualImage);
            (int width, int height) = imageEditor.GetSize();

            imageEditor.Crop(0, cropFromTop, width, height - cropFromTop - cropFromBottom);

            actualImage = imageEditor.GetUpdatedImage();
        }

        visualRegressionTester.VerifyMatchesSnapshot(name, actualImage, environmentName: App.PlatformName);
    }
}
```

With UI testing, we compare the expected snapshot with the actual image we received during test execution. The `BaseTest` class has methods, that allow comparison of the snapshots.

So many preparations. When I will finally write the test?

Here are the tests:

```csharp
namespace Client.UITests;

public class LoginPageTests(ITestOutputHelper testOutputHelper) : BaseTest(testOutputHelper)
{
    [Fact]
    public async Task AppLaunches()
    {
        await Task.Delay(2000);
        VerifyScreenshot($"{nameof(AppLaunches)}");
    }

    [Fact]
    public async Task LoginBtnTest()
    {
        // Arrange
        var element = FindUiElement("LoginBtn");

        // Act
        element.Click();
        await Task.Delay(500);

        VerifyScreenshot($"{nameof(Login)}");
    }
}
```

Here we have 2 simple tests. The first one just waits 2 seconds and then takes the screenshot and compares it with the predefined "AppLaunches.png". The second test finds and clicks on the Login button and again compares the screenshots.

But what if I want to run some platform tests only on a specific runtime? Let's leave it for the next article.

# Conclusion

As a .NET software engineer, incorporating both unit testing and UI testing into your development workflow will contribute to the overall quality and reliability of your .NET MAUI applications.

Happy coding, and may your .NET MAUI projects thrive with the power of comprehensive testing.