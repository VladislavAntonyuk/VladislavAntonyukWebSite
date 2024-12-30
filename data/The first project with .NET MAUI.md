Hello!

Today we will migrate an existing Xamarin.Forms Application to .NET MAUI! As a victim I chose my [KanbanBoard app](./articles/Creating-Kanban-Board-using-Xamarin-Forms-5 "KanbanBoard app"){target="_blank"}.

## Installation ##

First of all, we need to verify if we have prepared the development environment. One of the tools for that is `MAUI Check`. Run the next commands in PowerShell:
```
dotnet tool install -g Redth.Net.Maui.Check
maui-check
```
It will automatically attempt to fix any issues, **but I highly recommend using the Visual Studio installer.**

## Solution Configuration

1. Edit solution file
- Remove Platform-specific projects;
- Remove unused Solution Configuration Platforms

The base solution configuration is done. 

## It's project time

.NET MAUI introduces the `Single project` concept, SDK-project style, and much more. Let's first migrate our platforms to the "Shared" project.

1. Create the "Platforms" folder in the "Shared" project. Then for each platform create a folder in the "Platforms" project:
- Android
- iOS
- MacCatalyst
- Windows
- Tizen

1.1. Android
- Copy AndroidManifest.xml, MainActivity.cs, MainApplication.cs, all your services, Resources folder to the Android folder.

1.2. iOS, macOS
- Copy Main.cs, Info.plist, Entitlements.plist, AppDelegate.cs, and all your services to the iOS/MacCatalyst folder.

1.3. Windows
- Copy Package.appxmanifest, App.xaml, App.xaml.cs, app.manifest to the Windows folder.

1.4. Tizen
- Copy Main.cs, tizen-manifest.xml to the Tizen folder.

2. Delete Old platforms project folders.

3. Now we need to modify and change these files
- From `AndroidManifest.xml` remove the package name, version code, and version name. We will set these settings later in csproj file.
- Replace `MainActivity.cs` content with:
```csharp
namespace YourNamespace;

using Android.App;
using Android.Content.PM;

[Activity(Theme = "@style/Maui.SplashTheme",
		MainLauncher = true,
		Label = "YOUR_APP_TITLE")]
public class MainActivity : MauiAppCompatActivity
{
}
```
- Replace `MainApplication.cs` content with:
```csharp
namespace YourNamespace;
using Android.App;
using Android.Runtime;

[Application]
public class MainApplication : MauiApplication
{
    public MainApplication(IntPtr handle, JniHandleOwnership ownership)
        : base(handle, ownership)
    {
    }

    protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();
}
```

- Replace `AppDelegate.cs` content with:
```csharp
using Foundation;

namespace YourNamespace;

[Register(nameof(AppDelegate))]
public class AppDelegate : MauiUIApplicationDelegate
{
    protected override MauiApp CreateMauiApp()
    {
        return MauiProgram.CreateMauiApp();
    }
}
```

- Replace `App.xaml` from Windows folder with:
```xml
<maui:MauiWinUIApplication
    x:Class="YourNamespace.WinUI.App"
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    xmlns:maui="using:Microsoft.Maui"
    xmlns:local="YourNamespace.WinUI">

</maui:MauiWinUIApplication>
```

- Replace `App.xaml.cs` from Windows folder with:
```csharp
namespace YourNamespace.WinUI;

public partial class App : MauiWinUIApplication
{
	public App()
	{
		this.InitializeComponent();
	}

	protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();
}
```

- Replace `Package.appxmanifest` content with the next:
```xml
<?xml version="1.0" encoding="utf-8"?>
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
  xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
  IgnorableNamespaces="uap rescap">

  <Identity Name="maui-package-name-placeholder" Publisher="CN=Your Publisher Name" Version="0.0.0.0" />

  <Properties>
    <PublisherDisplayName>Your Publisher Name</PublisherDisplayName>
    <DisplayName>$placeholder$</DisplayName>
    <Logo>$placeholder$.png</Logo>
  </Properties>

  <Dependencies>
    <TargetDeviceFamily Name="Windows.Universal" MinVersion="10.0.17763.0" MaxVersionTested="10.0.19041.0" />
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.17763.0" MaxVersionTested="10.0.19041.0" />
  </Dependencies>

  <Resources>
    <Resource Language="x-generate" />
  </Resources>

  <Applications>
    <Application Id="App" Executable="$targetnametoken$.exe" EntryPoint="$targetentrypoint$">
      <uap:VisualElements
        DisplayName="$placeholder$"
        Description="$placeholder$"
        Square150x150Logo="$placeholder$.png"
        Square44x44Logo="$placeholder$.png"
        BackgroundColor="transparent">
        <uap:DefaultTile Square71x71Logo="$placeholder$.png" Wide310x150Logo="$placeholder$.png" Square310x310Logo="$placeholder$.png" />
        <uap:SplashScreen Image="$placeholder$.png" />
      </uap:VisualElements>
    </Application>
  </Applications>

  <Capabilities>
    <rescap:Capability Name="runFullTrust" />
  </Capabilities>

</Package>
```

- Replace `Main.cs` from Tizen folder with:
```csharp
namespace YourNamespace;

class Program : MauiApplication
{
	protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();

	static void Main(string[] args)
	{
		var app = new Program();
		app.Run(args);
	}
}
```

4. Replace all `Xamarin.Forms` with `Microsoft.Maui` (somewhere you may need to add `Microsoft.Maui.Controls`
5. Replace `App.xaml.cs` file content in the root folder with the next code:
```csharp
namespace YourNamespace;

public partial class App : Application
{
    public App()
    {
        InitializeComponent();
        MainPage = new MainPage();
    }
}
```
6. Create MauiProgram.cs with content:
```csharp
namespace YourNamespace;

public static class MauiProgram
{
	public static MauiApp CreateMauiApp()
	{
		var builder = MauiApp.CreateBuilder();
		builder
			.UseMauiApp<App>()
			.ConfigureFonts(fonts =>
			{
				fonts.AddFont("fasolid.otf", "FASolid"); // move you fonts from AssemblyInfo here
			});
		builder.Services.AddTransient<IPath, DbPath>(); // here you register all your services for DI
		return builder.Build();
	}
}
```
7. Replace ```xmlns="http://xamarin.com/schemas/2014/forms"``` with ```xmlns="http://schemas.microsoft.com/dotnet/2021/maui"```
8. Finally update csproj file with:
```xml
<Project Sdk="Microsoft.NET.Sdk">

	<PropertyGroup>
		<TargetFrameworks>net6.0-android;net6.0-ios;net6.0-maccatalyst</TargetFrameworks>
		<TargetFrameworks Condition="$([MSBuild]::IsOSPlatform('windows'))">$(TargetFrameworks);net6.0-windows10.0.19041.0</TargetFrameworks>
		<TargetFrameworks>$(TargetFrameworks);net6.0-tizen</TargetFrameworks>
		<OutputType>Exe</OutputType>
		<RootNamespace>YourNamespace</RootNamespace>
		<UseMaui>true</UseMaui>
		<SingleProject>true</SingleProject>
		<ImplicitUsings>enable</ImplicitUsings>

		<!-- Display name -->
		<ApplicationTitle>YourTitle</ApplicationTitle>

		<!-- App Identifier -->
		<ApplicationId>com.vladislavantonyuk.yournamespace</ApplicationId>
		<ApplicationIdGuid>F46BB7C8-E6A5-4D9E-AAFE-8173B0819787</ApplicationIdGuid>

		<!-- Versions -->
		<ApplicationDisplayVersion>1.0</ApplicationDisplayVersion>
		<ApplicationVersion>1</ApplicationVersion>

		<SupportedOSPlatformVersion Condition="$([MSBuild]::GetTargetPlatformIdentifier('$(TargetFramework)')) == 'ios'">14.2</SupportedOSPlatformVersion>
		<SupportedOSPlatformVersion Condition="$([MSBuild]::GetTargetPlatformIdentifier('$(TargetFramework)')) == 'maccatalyst'">14.0</SupportedOSPlatformVersion>
		<SupportedOSPlatformVersion Condition="$([MSBuild]::GetTargetPlatformIdentifier('$(TargetFramework)')) == 'android'">21.0</SupportedOSPlatformVersion>
		<SupportedOSPlatformVersion Condition="$([MSBuild]::GetTargetPlatformIdentifier('$(TargetFramework)')) == 'windows'">10.0.17763.0</SupportedOSPlatformVersion>
		<TargetPlatformMinVersion Condition="$([MSBuild]::GetTargetPlatformIdentifier('$(TargetFramework)')) == 'windows'">10.0.17763.0</TargetPlatformMinVersion>
		<SupportedOSPlatformVersion Condition="$([MSBuild]::GetTargetPlatformIdentifier('$(TargetFramework)')) == 'tizen'">6.5</SupportedOSPlatformVersion>
	</PropertyGroup>

	<ItemGroup>
		<!-- App Icon -->
		<MauiIcon Include="Resources\appicon.svg" ForegroundFile="Resources\appiconfg.svg" Color="#512BD4" />

		<!-- Splash Screen -->
		<MauiSplashScreen Include="Resources\appiconfg.svg" Color="#512BD4" BaseSize="128,128" />

		<!-- Images -->
		<MauiImage Include="Resources\Images\*" />

		<!-- Custom Fonts -->
		<MauiFont Include="Resources\Fonts\*" />

		<!-- Raw Assets (also remove the "Resources\Raw" prefix) -->
		<MauiAsset Include="Resources\Raw\**" LogicalName="%(RecursiveDir)%(Filename)%(Extension)" />
	</ItemGroup>
</Project>
```
Pay attention to the last ItemGroup. .NET MAUI is integrated with Resizetizer NT, so MauiImage and MauiFont will automatically prepare resources for all your applications.

## Build and Run ##
```bash
# For Android
dotnet build KanbanBoard.csproj -t:Run -f net6.0-android
# For iOS
dotnet build KanbanBoard.csproj -t:Run -f net6.0-ios
# For macOS
dotnet build KanbanBoard.csproj -t:Run -f net6.0-maccatalyst
# For Windows
dotnet build KanbanBoard.csproj -t:Run -f net6.0-windows10.0.19041.0
```

## Issues ##
### 1. Android deployment (Solved) ###
I was not able to deploy the application to the device until specified the RuntimeIdentifiers for Android. Add this line to the `PropertyGroup` in your csproj file:
```xml
<RuntimeIdentifiers Condition="$(TargetFramework.Contains('-android'))">android-arm;android-arm64;android-x86;android-x64</RuntimeIdentifiers>
```
### 2. iOS Device deployment (Solved) ###
I was not able to deploy the application to the device until specified the RuntimeIdentifiers. Add this line to the csproj file:
```xml
<PropertyGroup Condition="$([MSBuild]::GetTargetPlatformIdentifier('$(TargetFramework)')) == 'ios' and $(Configuration) == 'Release'">
	<RuntimeIdentifier>ios-arm64</RuntimeIdentifier>
	<CodesignEntitlement>Entitlements.plist</CodesignEntitlement>
	<ArchiveOnBuild>true</ArchiveOnBuild>
</PropertyGroup>

<PropertyGroup Condition="$([MSBuild]::GetTargetPlatformIdentifier('$(TargetFramework)')) == 'ios' and $(Configuration) == 'Debug'">
	<RuntimeIdentifier>ios-arm64</RuntimeIdentifier>
	<RuntimeIdentifier>iossimulator-x64</RuntimeIdentifier>
</PropertyGroup>
```
### 3. Windows release (Solved) ###
To generate the Appx file add the next code to the csproj file:
```xml
<PropertyGroup Condition="$(TargetFramework.Contains('-windows')) and '$(Configuration)' == 'Release'">
	<GenerateAppxPackageOnBuild>true</GenerateAppxPackageOnBuild>
	<AppxPackageSigningEnabled>False</AppxPackageSigningEnabled>
</PropertyGroup>
```

The final result:
![Kanban MAUI](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/8/kanban-maui.png)

You can find the code changes on [GitHub](https://github.com/VladislavAntonyuk/KanbanBoard/tree/maui)