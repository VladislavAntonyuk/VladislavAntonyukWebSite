Hello!

Today, we will create a small .NET MAUI application and extend it with iOS Share App Extension.

App extensions let you extend custom functionality and content beyond your app and make it available to users while they’re interacting with other apps or the system.

I hope you already have a valid environment. Read [this article](./articles/The-first-project-with-.NET-MAUI) on how to set up .NET MAUI.

If you prefer a video tutorial you can find it on YouTube:

[![Extend .NET MAUI application with iOS Extensions](https://img.youtube.com/vi/nSHXQP3zVFE/0.jpg)](https://www.youtube.com/watch?v=nSHXQP3zVFE)

So let's start!
1. Create a new .NET MAUI project.
2. Create a new Xamarin iOS Application.
3. Create a new App Extension and select your Xamarin iOS app from step 2.
![Create iOS Extension](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/25/create-iOS-extension.png)
4. Open App Extension csproj file and replace the content:
```xml
<Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
        <TargetFrameworks>net6.0-ios</TargetFrameworks>
        <OutputType>Library</OutputType>
        <ApplicationId>YOUR-APPLICATION-ID-FROM-INFO.PLIST</ApplicationId>
        <ApplicationDisplayVersion>1.0</ApplicationDisplayVersion>
        <ApplicationVersion>1</ApplicationVersion>
    </PropertyGroup>

    <PropertyGroup>
        <IsAppExtension>true</IsAppExtension>
        <IsWatchExtension>false</IsWatchExtension>
    </PropertyGroup>
</Project>
```
5. Open the .NET MAUI Application csproj file and add a reference to App Extension:
```xml
<ProjectReference Include="PATH-TO-EXTENSION.csproj">
	<IsAppExtension>true</IsAppExtension>
	<IsWatchApp>false</IsWatchApp>
</ProjectReference>
```
6. (Optional) Now Xamarin iOS Application can be deleted.

That's it. As a result, you should receive such app:

![iOS Extension](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/25/result.png)

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/iOSExtensions){target="_blank"}.

Happy coding!