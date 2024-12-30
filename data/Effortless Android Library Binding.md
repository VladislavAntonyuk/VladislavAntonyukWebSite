Hello! 👋

The last article I wrote was about creating CalendarView with .NET MAUI Handler. For Android, I used `Android.Widget.CalendarView`. Unfortunately it doesn't have a material design and luck of some features. There is another library `com.applandeo:material-calendar-view`, but it is a Java library. We need to create a bindings library. Today I want to show you how to easily create an Android library binding.

## Getting Started

Create a new .NET Android Bindings library either through the VS "New Project" dialog or the command line:

```xml
dotnet new androidlib
```

Add the `XamPrototype.Android.MavenBinding.Tasks` NuGet package to the library through VS or the command line:

```xml
dotnet add package XamPrototype.Android.MavenBinding.Tasks
```

This package allows Java libraries to be bound directly from Maven repositories. It also provides a task to verify that all required Java dependencies are being fulfilled.

This feature focuses on tackling two pain points of binding from Maven:
- Acquiring the `.jar`/`.aar` and the related `.pom` from Maven
- Using the `.pom` to verify that required Java dependencies are being fulfilled

Let's take an example: `com.applandeo:material-calendar-view` version `1.9.0` available in [Maven](https://mvnrepository.com/artifact/com.applandeo/material-calendar-view).

Add a new `<AndroidMavenLibrary>` which specifies the Java artifact we want to bind:

```xml
<!-- Include format is {GroupId}:{ArtifactId} -->
<ItemGroup>
  <AndroidMavenLibrary Include="com.applandeo:material-calendar-view" Version="1.9.0" />
</ItemGroup>
```

> Note: By default, this pulls the library from Maven Central. There is also support for Google's Maven, custom Maven repositories, and local Java artifact files.  See [Advanced MavenDownloadTask Usage](https://github.com/jpobst/Prototype.Android.MavenBindings/wiki/MavenDownloadTask-Advanced-Scenarios) for more details.

If you compile the binding now, the library will be automatically downloaded from Maven as well as the associated `.pom` file. The `.pom` file details the dependencies needed by this library, and the build errors will be generated:

```
error XA0000: Maven dependency 'org.jetbrains.kotlin:kotlin-stdlib' version '1.9.21' is not satisfied. Microsoft maintains the NuGet package 'Xamarin.Kotlin.StdLib' that could fulfill this dependency.
```

To fix such an error we can add suggested NuGet packages:

```
dotnet add package Xamarin.Kotlin.StdLib
```

If some bindings are not available in NuGet, we can add them manually from Maven without binding:

```xml
<AndroidMavenLibrary Include="org.jetbrains.kotlin:kotlin-android-extensions-runtime" Version="1.6.10" Bind="false" />
<AndroidMavenLibrary Include="com.annimon:stream" Version="1.2.2" Bind="false" />
```

> Note: Not all dependencies will have official NuGet bindings. For other examples of ways to fulfill dependencies, see [Advanced MavenDependencyVerifierTask Scenarios](https://github.com/jpobst/Prototype.Android.MavenBindings/wiki/MavenDependencyVerifierTask-Advanced-Scenarios).

Now if you try to compile the library the dependencies will be detected as fulfilled, and the build continues. If you get C# compile errors (like with this package) you are now back to the normal binding process. (ie: fixing with Metadata).

## Conclusion

![.NET MAUI CalendarView Android Material](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/50/50.png)

That's it! You can now easily create Android library bindings.

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/AndroidBindableLibraries/MaterialCalendarView){target="_blank"}.

Happy Bindings!