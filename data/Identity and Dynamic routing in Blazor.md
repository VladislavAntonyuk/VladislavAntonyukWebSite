Welcome!

This is the debut of the Blazor category on my website and I start it by describing how to build a dynamic route based on current user identity.

## The issue. ##

If you create a website like a photo gallery, file system, or internet shop, you need a dynamic route (controller/action), similar to CMS. 

Example: User enters `http://sample.com/root/folder1/folder2/folder3/file34` and then asked for the controller or action at runtime. To decide what to return with this path I need to know the user identity, because different users may have the same folder structure.

I am using the `DynamicRouteValueTransformer` routing endpoint feature, creating a `TestControllerTransformer` inherit `DynamicRouteValueTransformer`. But in `TestControllerTransformer` I was not able to obtain the User Identity, later on, the User Identity controller is available.

```csharp
public class TestControllerTransformer : DynamicRouteValueTransformer
    {
        private ILogger<TestControllerTransformer> _logger;

        public TestControllerTransformer(ILogger<TestControllerTransformer> logger)
        {
            _logger = logger;
        }

        public override ValueTask<RouteValueDictionary> TransformAsync(HttpContext httpContext, RouteValueDictionary values)
        {
            if (httpContext.User.Identity.IsAuthenticated)
            {
                _logger.LogTrace("User Authenicated");
                var fileId = GetFileId(values, httpContext.User.FindFistValue(ClaimsType.NameIdentifier);

                values["controller"] = "Files";
                values["action"] = "GetFile";
            }
            else
            {
                _logger.LogTrace("User NOT Authenicated");
            }

            return new ValueTask<RouteValueDictionary>(values);
        }
    }
```
I was waiting for `httpContext.User.Identity.IsAuthenticated` to be true in `TestControllerTransformer` after login user, but I received false.

## Solution ##
When I investigated the issue, I saw a lot of suggestions to inject `IHttpContextAccessor`, and it actually works, but not in Blazor. Blazor apps run outside of the context of the ASP.NET Core pipeline. The `HttpContext` isn't guaranteed to be available within the `IHttpContextAccessor`, nor is it guaranteed to be holding the context that started the Blazor app. You can read more on [Microsoft Docs](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/http-context?view=aspnetcore-5.0#blazor-and-shared-state){target="_blank"}.

The solution for Blazor (and it works for ASP.NET Core as well) is much easier.

The main issue was in the configuration. You have to understand how ASP.NET Core middlewares work and the responsibility of each of them. You can read more on [Microsoft Docs](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/middleware/){target="_blank"}.

So the default order looks like this:

![Middleware pipeline](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/6/middleware-pipeline.svg)

As you can see the `Routing middleware` executes before `Authentication middleware`, where actually User sets. So to fix the issue you just need to put `Authentication middleware` before `Routing middleware`:

```csharp
public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
		{
			if (env.IsDevelopment())
			{
				app.UseDeveloperExceptionPage();
			}
			else
			{
				app.UseExceptionHandler("/Error");
				app.UseHsts();
			}

			app.UseHttpsRedirection();
			app.UseStaticFiles();

			app.UseAuthentication();
			app.UseRouting();
			app.UseAuthorization();

			app.UseEndpoints(endpoints =>
			{
				endpoints.MapControllers();
				endpoints.MapBlazorHub();
				endpoints.MapFallbackToPage("/_Host");
			});
		}
```

The issue source: [link](https://es.codefaq.info/la_identidad_del_usuario_en_dynamicroutevaluetransformer){target="_blank"}