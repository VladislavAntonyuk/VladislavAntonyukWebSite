Hi there!

Today I will try to replicate the Google Photos Gallery design.

It won't be a general CollectionView with an identical cell size. Let's create an infinite scrolling mosaic gallery using .NET MAUI Blazor!

If you are familiar with Blazor you shouldn't have any difficulties migrating your existing website to a mobile application. That way, when you compile your app it will run as a native application, just like any other .NET MAUI app.

Let’s create a new .NET MAUI Blazor app:

```bash
dotnet new maui-blazor
```

The structure of the application is pretty simple. I would say it's a Blazor app with `App.xaml` and `MainPage.xaml`.

![MAUI Blazor structure](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/16/MauiBlazorStructure.png)

.NET MAUI brings a new `BlazorWebView` control which is responsible to load and run your application. You need to provide a `HostPage` and `RootComponents`:

```xml
<b:BlazorWebView HostPage="wwwroot/index.html">
    <b:BlazorWebView.RootComponents>
        <b:RootComponent Selector="#app" ComponentType="{x:Type local:Main}" />
    </b:BlazorWebView.RootComponents>
</b:BlazorWebView>
```

You do the same in the Blazor app:
```csharp
var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
```

You also need to register `BlazorWebView` control in `MauiProgram.cs`:

```csharp
var builder = MauiApp.CreateBuilder();
builder.UseMauiApp<App>();
builder.Services.AddMauiBlazorWebView();
return builder.Build();
```

Now, let's go back to our initial task of building an infinite scrolling gallery app.

For infinite scrolling, we can use `Sve.Blazor.InfiniteScroll` package. From its name, you can see that it was developed for Blazor, but it perfectly works in our .NET MAUI app as well!

So, install the package:
```xml
<PackageReference Include="Sve.Blazor.InfiniteScroll" Version="1.0.0-alpha" />
```

You can add any Blazor package and simplify your mobile application development.
 
Now let's create our gallery by editing `Index.razor` page:

```html
@page "/"

@using MauiBlazorPhotoGallery.Data
@using Sve.Blazor.InfiniteScroll.Components
@inject MediaService mediaService

@if (items == null)
{
    <p><em>Loading...</em></p>
}
else
{
    <InfiniteScroll ObserverTargetId="observerTarget" ObservableTargetReached="(e) => GetMediaItems()">
        <div class="grid">
            @foreach (var item in items)
            {
                <div class="grid-item">
                    <img src="@item.Link" />
                </div>
            }

            @*The target element that we observe. Once this is reached the callback will be triggered.*@
            <div id="observerTarget"></div>
        </div>
    </InfiniteScroll>
}

@code {
    private List<MediaItem> items = new();

    void GetMediaItems()
    {
        items.AddRange(mediaService.GetMediaItems());
    }
}
```

As you can see it's a plain Blazor page without any code specific to mobile development.

Now let's customize our page by adding `Index.razor.css`:
```css
/* customize container */
.grid {
    display: flex;
    flex-wrap: wrap;
}

/* customize each image container */
.grid-item {
    border-radius: 10px;
    background-size: cover;
    background-position: center;
    margin: 0.3em;
    height: 10em;
    width: 10em;
    flex-grow: 1;
}

/* set different width for children to achieve mosaic effect */
    .grid-item:nth-child(2n) {
        width: 15em;
    }

    .grid-item:nth-child(2n) {
        width: 14em;
    }

    .grid-item:nth-child(4n) {
        width: 12em;
    }

    .grid-item:nth-child(5n) {
        width: 7em;
    }

    .grid-item:nth-child(6n) {
        width: 20em;
    }

/* fill container with image */
    .grid-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
```

That's it! You can start the app and wait a few seconds while Blazor starts the app. By scrolling to the bottom of the page, you should see how images dynamically append to the gallery.

![.NET MAUI Blazor gallery](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/16/MauiBlazorGallery.gif)

## Conclusion

.NET MAUI Blazor is a vast enhancement. It opens the door to mobile development for web developers. A front-end developer can create a beautiful UI using HTML and CSS for a web app or reuse it in a mobile application.

It also brings a lot of new controls which were not previously available in native apps.

You can find the source code on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/MauiBlazorPhotoGallery){target="_blank"}.