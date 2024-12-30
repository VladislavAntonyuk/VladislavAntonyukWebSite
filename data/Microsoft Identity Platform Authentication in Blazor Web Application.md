Hello! 👋

It's less then a month left before the .NET 8 release. It's a great time to start exploring new features and improvements. One of them is a new Blazor Web App.

Blazor Web Apps provide a component-based architecture with server-side rendering and full client-side interactivity in a single solution, where you can switch between server-side and client-side rendering modes and even mix them in the same page.

The latest .NET 8 RC2 release brings Individual account authentication, but it's not enough for a real-world application. In this article, we will explore how to integrate Microsoft Identity Platform Authentication into a Blazor Web App.

The use of Microsoft's Identity greatly enhances user authentication and authorization in web apps. This article outlines the steps required to integrate Microsoft Entra ID (formerly Azure Active Directory) into a Blazor web application.

## Precondition

If you don't have an Azure Active Directory, watch this video on how to set it up:

[![Azure Active Directory authentication in .NET MAUI](https://img.youtube.com/vi/3RGX5mVRXSs/0.jpg)](https://www.youtube.com/watch?v=3RGX5mVRXSs)
 
And Azure Active Directory (B2C):

[![Azure Active Directory B2C authentication in .NET MAUI](https://img.youtube.com/vi/sTPWF2O456U/0.jpg)](https://www.youtube.com/watch?v=sTPWF2O456U)

## Step 1: Install the Required Package

Start by installing the necessary NuGet package, 'Microsoft.Identity.Web.UI'. You can do this by adding the following line to your project file:

```xml
<PackageReference Include="Microsoft.Identity.Web.UI" Version="2.15.1" />
```

## Step 2: Update the Configuration File

Next, add the following block of configuration to your `appsettings.json` file, replacing placeholders (enclosed in "{}") with info from your Azure AD B2C tenant:

```json
"AzureAdB2C": {
    "Instance": "https://{YOUR_APP_NAME}.b2clogin.com",
    "TenantId": "{YOUR_TENANT_ID}",
    "ClientId": "{YOUR_CLIENT_ID}",
    "CallbackPath": "/signin-oidc",
    "Domain": "{YOUR_APP_NAME}.onmicrosoft.com",
    "SignedOutCallbackPath": "/signout",
    "SignUpSignInPolicyId": "B2C_1_SIGNUP_SIGNIN",
    "ClientSecret": "{YOUR_AAD_B2C_CLIENT_SECRET}",
    "AllowWebApiToBeAuthorizedByACL": true
}
```

## Step 3: Add Authentication Services 

In the `Program.cs` file, utilize the built-in configuration binding to bind AzureAdB2C configuration to the Microsoft Identity options and register the necessary services related to Microsoft Identity, as shown below:

```csharp
builder.Services.AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
				.AddMicrosoftIdentityWebApp(options =>
				{
					builder.Configuration.Bind("AzureAdB2C", options);
					// TODO - remove this line when token validation issue is fixed.
					options.TokenValidationParameters.ValidateIssuer = false;
				});
builder.Services.AddControllersWithViews().AddMicrosoftIdentityUI();
builder.Services.AddCascadingAuthenticationState();
```

**Currently, we need to disable issuer validation. Otherwise authentication fails.**

## Step 4: Configure the Middleware

Next, register `MapControllers` middleware, as shown:

```csharp
app.MapControllers();
app.MapRazorComponents<App>().AddInteractiveServerRenderMode();
```

## Step 5: Create an Authentication Page

Finally, set up an authentication page to handle signing in and signing out. Here's a sample page (`Auth.razor`):

```razor
@page "/auth"
<PageTitle>Auth</PageTitle>

<AuthorizeView>
	<Authorized>
		<p>User name: @user?.Identity?.Name</p>
		<button @onclick="SignOut">Sign out</button>
	</Authorized>
	<NotAuthorized>
		<button @onclick="SignIn">Sign in</button>
	</NotAuthorized>
</AuthorizeView>

@code {
    private ClaimsPrincipal? user;

    [CascadingParameter]
    public required Task<AuthenticationState> AuthenticationState { get; set; }

    [Inject]
    public required NavigationManager NavigationManager { get; set; }

    private void SignOut()
    {
        NavigationManager.NavigateTo("MicrosoftIdentity/Account/SignOut", true);
    }

    private void SignIn()
    {
        NavigationManager.NavigateTo("MicrosoftIdentity/Account/SignIn", true);
    }

    protected override async Task OnInitializedAsync()
    {
        var authenticationState = await AuthenticationState;
        user = authenticationState.User;
    }
}
```

This setup delivers a functional authentication page where users can effectively sign in or sign out.

## Conclusion

There is an open issue on GitHub related to the missed Microsoft Identity Platform auth option in the Blazor Web App template. You can track it [here](https://github.com/dotnet/aspnetcore/issues/51202){target="_blank"}. It's planned to be solved in the .NET 9 release.

To simplify the steps, I created a template that you can use to create a new Blazor Web App with Microsoft Identity Platform Authentication. You can find it [here](https://github.com/VladislavAntonyuk/.NET-Templates?tab=readme-ov-file#blazor-webapp-microsoft-identity-platform){target="_blank"}.

Happy Hacktoberfest!