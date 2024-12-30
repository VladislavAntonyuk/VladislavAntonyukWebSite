Hello!

If you are tired of my .NET MAUI articles, let's talk about .NET Aspire and authentication in your distributed applications.

If you don't know, .NET Aspire is an opinionated, cloud-ready stack for building observable, production-ready, distributed applications. It is designed to improve the experience of building .NET cloud-native apps. Learn more about .NET Aspire [here](https://learn.microsoft.com/en-us/dotnet/aspire/get-started/aspire-overview).

But what task am I trying to solve and what problems am I having?

I have a default .NET Aspire app with a Blazor frontend and API service. The user should be able to sign in on UI using Microsoft Entra ID (Azure Active Directory) and call the API service. Unfortunately, the API request from the Blazor frontend to API Service returns 401/unauthenticated.

The issue is rather common (there are multiple issues opened on GitHub) and I spent about 1 week to make a successful response from the API Service. So let's go with what you need to make it work.

If you don't have an Azure Active Directory, watch this video on how to set it up:

[![Azure Active Directory authentication in .NET MAUI](https://img.youtube.com/vi/3RGX5mVRXSs/0.jpg)](https://www.youtube.com/watch?v=3RGX5mVRXSs)
 
And Azure Active Directory (B2C):

[![Azure Active Directory B2C authentication in .NET MAUI](https://img.youtube.com/vi/sTPWF2O456U/0.jpg)](https://www.youtube.com/watch?v=sTPWF2O456U)

# API Service

Starting with a configuration of API Service:

1. Create a new .NET Aspire project.
2. Install the `Microsoft.Identity.Web` package in the API project.
3. Update `appsettings.json` with your AAD configuration:
```json
"AzureAdB2C": {
  "Instance": "https://{YOUR_APP}.b2clogin.com",
  "TenantId": "YOUR_TENANT_ID",
  "ClientId": "YOUR_CLIENT_ID",
  "CallbackPath": "/signin-oidc",
  "Domain": "{YOUR APP}.onmicrosoft.com",
  "SignedOutCallbackPath": "/signout",
  "SignUpSignInPolicyId": "B2C_1_SIGNUP_SIGNIN",
  "ClientSecret": "YOUR_CLIENT_SECRET"
}
```

4. Then modify `Program.cs` with the registration of WebApi Authentication:
```csharp
builder.Services.AddMicrosoftIdentityWebApiAuthentication(builder.Configuration, Constants.AzureAdB2C);
builder.Services.AddAuthorization();
```

5. Update your endpoints with `[Authorize]` attribute or call `.RequireAuthorization()` for minimal API.

API Service is ready.

# FrontEnd

1. Install the next packages in a Web project:
```xml
<ItemGroup>
 <PackageReference Include="Microsoft.Identity.Web.DownstreamApi" Version="3.0.1" />
 <PackageReference Include="Microsoft.Identity.Web.UI" Version="3.0.1" />
</ItemGroup>
```

2. Update `appsettings.json` with your AAD configuration:
```json
"AzureAdB2C": {
  "Instance": "https://{YOUR_APP}.b2clogin.com",
  "TenantId": "YOUR_TENANT_ID",
  "ClientId": "{YOUR_APP}",
  "CallbackPath": "/signin-oidc",
  "Domain": "{YOUR APP}.onmicrosoft.com",
  "SignedOutCallbackPath": "/signout",
  "SignUpSignInPolicyId": "B2C_1_SIGNUP_SIGNIN",
  "ClientSecret": "YOUR_CLIENT_SECRET",
  "AllowWebApiToBeAuthorizedByACL": true
},
"ApiClient": {
  "BaseUrl": "https+http://apiservice",
  "Scopes": [
    "https://{YOUR_APP}.onmicrosoft.com/YOUR_CLIENT_ID/.default",
    "https://{YOUR_APP}.onmicrosoft.com/YOUR_CLIENT_ID/Read"
 ]
}
```

> **IMPORTANT**. Pay attention to scopes. It is required for the Downstream API. If you forget to change the Scopes to an array, when you try to use the IDownstreamApi the scopes will appear null, and IDownstreamApi will attempt an anonymous (unauthenticated) call to the downstream API, which will result in a 401/unauthenticated.

3. Update `Program.cs` to register required services:

```csharp
var scopes = builder.Configuration.GetSection("ApiClient:Scopes").Get<string[]>();
builder.Services.AddMicrosoftIdentityWebAppAuthentication(builder.Configuration, Microsoft.Identity.Web.Constants.AzureAdB2C)
 .EnableTokenAcquisitionToCallDownstreamApi(scopes)
 .AddDownstreamApi("ApiClient", builder.Configuration.GetSection("ApiClient"))
 .AddInMemoryTokenCaches();

builder.Services.AddControllersWithViews().AddMicrosoftIdentityUI();
builder.Services.AddCascadingAuthenticationState();
builder.Services.AddAuthorization();

builder.Services.AddRazorComponents()
 .AddInteractiveServerComponents()
 .AddMicrosoftIdentityConsentHandler();

...

var app = builder.Build();

...
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
...
```

# Downstream API

Downstream API is an HTTP Wrapper, that under the hood retrieves the token and then makes the request.

`MicrosoftIdentityConsentAndConditionalAccessHandler` is a handler for Blazor-specific APIs to handle incremental consent and conditional access.


```csharp
public class WeatherApiClient(IDownstreamApi downstreamApi, MicrosoftIdentityConsentAndConditionalAccessHandler handler)
{
    public async Task<List<WeatherForecast>> GetWeatherAsync(CancellationToken cancellationToken = default)
    {
        List<WeatherForecast>? forecasts = null;

        try
        {
          forecasts = await downstreamApi.GetForUserAsync<List<WeatherForecast>>("ApiClient", options =>
          {
            options.RelativePath = "/weatherforecast";
          }, cancellationToken: cancellationToken);
        }
        catch (Exception e)
        {
          handler.HandleException(e);
        }

        return forecasts ?? [];
    }
}
```

We are done. Start the application and check the result.

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/AspireSamples/tree/main/DistributedApplicationAuth){target="_blank"}.
