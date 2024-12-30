Hello from sunny July! As a good tradition, it's time for [MAUI UI July](https://goforgoldman.com/posts/mauiuijuly-24/). Thanks to Matt Goldman for the organization.

Barcode scanning is a common requirement in modern mobile applications, enabling features such as product information retrieval, inventory management, and point-of-sale systems. .NET MAUI allows developers to create cross-platform applications with ease, and there are several libraries and tools available to implement barcode scanning. This article explores three methods: `MLKit for Android`, `Camera.MAUI.ZXing`, and `CommunityToolkit.Maui.Camera`.

### 1. MLKit for Android

ML Kit brings Google’s machine learning expertise to mobile developers in a powerful and easy-to-use package for various functionalities, including barcode scanning. For .NET MAUI applications targeting Android, MLKit offers a robust and accurate solution.

#### Steps to Implement MLKit Barcode Scanning in .NET MAUI:

1. **Install MLKit NuGet Package**

    ```xml
    <ItemGroup Condition="'$(TargetFramework)' == 'net8.0-android'">
        <PackageReference Include="Xamarin.AndroidX.Collection.Ktx" Version="1.4.0.1" />
        <PackageReference Include="Xamarin.GooglePlayServices.Code.Scanner" Version="116.1.0.4" />
    </ItemGroup>
    ```

1. **Configure Barcode Scanning**

    In the `Platforms\Android` folder create a new class `MlKitBarcodeScanner`.

    ```csharp
    using Xamarin.Google.MLKit.Vision.Barcode.Common;
    using Xamarin.Google.MLKit.Vision.CodeScanner;
    using Android.Gms.Tasks;
    using Android.Runtime;
    using Java.Lang;

    public class MlKitBarcodeScanner : IDisposable
    {
        private readonly IGmsBarcodeScanner barcodeScanner = GmsBarcodeScanning.GetClient(
            Platform.AppContext,
            new GmsBarcodeScannerOptions.Builder()
                .AllowManualInput()
                .EnableAutoZoom()
                .SetBarcodeFormats(Barcode.FormatAllFormats)
                .Build());

        public async Task<Barcode?> ScanAsync()
        {
            var taskCompletionSource = new TaskCompletionSource<Barcode?>();
            var barcodeResultListener = new OnBarcodeResultListener(taskCompletionSource);
            using var task = barcodeScanner.StartScan()
                        .AddOnCompleteListener(barcodeResultListener);
            return await taskCompletionSource.Task;
        }

        public void Dispose()
        {
            barcodeScanner.Dispose();
        }
    }

    public class OnBarcodeResultListener(TaskCompletionSource<Barcode?> taskCompletionSource) : Object, IOnCompleteListener
    {
        public void OnComplete(Task task)
        {
            if (task.IsSuccessful)
            {
                taskCompletionSource.SetResult(task.Result.JavaCast<Barcode>());
            }
            else if (task.IsCanceled)
            {
                taskCompletionSource.SetResult(null);
            }
            else
            {
                taskCompletionSource.SetException(task.Exception);
            }
        }
    }
    ```

1. **Update AndroidManifest.xml**

    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <manifest xmlns:android="http://schemas.android.com/apk/res/android">
        <application android:allowBackup="true" android:icon="@mipmap/appicon" android:roundIcon="@mipmap/appicon_round" android:supportsRtl="true">
            <meta-data
                android:name="com.google.mlkit.vision.DEPENDENCIES"
                android:value="barcode_ui"/>
        </application>
        <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
        <uses-permission android:name="android.permission.INTERNET" />
        <uses-permission android:name="android.permission.CAMERA" />
        <uses-permission android:name="android.permission.RECORD_AUDIO" />
        <uses-permission android:name="android.permission.RECORD_VIDEO" />
    </manifest>
    ```

1. **Handle Barcode Detection**

    ```csharp
    using var mlkit = new MlKitBarcodeScanner();
    var barcode = await mlkit.ScanAsync();
    await MainThread.InvokeOnMainThreadAsync(async () =>
    {
        await Toast.Make(barcode is null ? "Error has occurred during barcode scanning" : barcode.RawValue, ToastDuration.Long).Show();
    });
    ```

![.NET MAUI MLKit Android](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/56/mlkit.gif)

### 2. Camera.MAUI.ZXing

ZXing is a popular open-source barcode scanning library. The Camera.MAUI.ZXing library is a .NET MAUI-specific implementation that leverages ZXing for barcode scanning, providing a cross-platform solution.

#### Steps to Implement Camera.MAUI.ZXing:

1. **Install Camera.MAUI.ZXing**

    ```xml
    <PackageReference Include="Camera.MAUI.ZXing" Version="1.0.0" />
    ```

1. **Configure the Camera**

    Update `MauiProgram.cs` to add MauiCameraView:

    ```csharp
    builder
        .UseMauiApp<App>()
        .UseMauiCameraView();
    ```

1. **Initialize ZXing Barcode Scanner**

    Create a `CameraView` in your XAML or C# code to display the camera feed and handle barcode scanning.

    ```xml
    <maui:CameraView
        x:Name="ZxingCameraView"
        AutoStartPreview="True"
        HeightRequest="300"
        WidthRequest="300"
        BarCodeDetectionEnabled="True"
        ControlBarcodeResultDuplicate="True"/>
    ```

    Configure `BarCodeDecoder` and subscribe to `BarcodeDetected`:

    ```csharp
    public partial class ZxingCameraPage : ContentPage
    {
        public ZxingCameraPage()
        {
            InitializeComponent();
            ZxingCameraView.BarCodeOptions = new BarcodeDecodeOptions
            {
                AutoRotate = true,
                PossibleFormats = [BarcodeFormat.QR_CODE],
            };
            ZxingCameraView.BarCodeDecoder = new ZXingBarcodeDecoder();
        }

        private void ZxingCameraView_CamerasLoaded(object? sender, EventArgs e)
        {
            if (ZxingCameraView.NumCamerasDetected == 0)
            {
                return;
            }

    #if WINDOWS
            ZxingCameraView.Camera = ZxingCameraView.Cameras.FirstOrDefault();
    #else
            ZxingCameraView.Camera = ZxingCameraView.Cameras.FirstOrDefault(x => x.Position != CameraPosition.Front);
    #endif
        }

        private async void ZxingCameraViewOnBarcodeDetected(object sender, BarcodeEventArgs args)
        {
            foreach (var result in args.Result)
            {
                await MainThread.InvokeOnMainThreadAsync(async () =>
                {
                    await Toast.Make(result.Text, ToastDuration.Long).Show();
                });
            }
        }

        protected override void OnAppearing()
        {
            base.OnAppearing();
            ZxingCameraView.BarcodeDetected += ZxingCameraViewOnBarcodeDetected;
            ZxingCameraView.CamerasLoaded += ZxingCameraView_CamerasLoaded;
        }
    }
    ```

![Camera.MAUI.Zxing](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/56/zxing.png)

### 3. CommunityToolkit MAUI Camera

The .NET MAUI Community Toolkit provides various useful tools and controls, including camera support. The `CommunityToolkit.Maui.Camera` can be used for capturing images, which can then be processed for barcode scanning.

#### Steps to Implement CommunityToolkit MAUI Camera:

1. **Install CommunityToolkit.Maui**

    ```xml
    <PackageReference Include="CommunityToolkit.Maui.Camera" Version="1.0.2" />
    ```

1. **Configure the Camera**

    Update `MauiProgram.cs` to add MauiCameraView:

    ```csharp
    builder
        .UseMauiApp<App>()
        .UseMauiCommunityToolkitCamera();
    ```

1. **Initialize CameraView**:

    Create a `CameraView` in your XAML or C# code to display the camera feed and handle barcode scanning.

    ```xml
    <toolkit:CameraView x:Name="ToolkitCameraView" />
    ```

    `CommunityToolkit.Maui.Camera` doesn't have a built-in mechanism for barcode scanning, but we can capture an image every N seconds and pass it to the `BarcodeReaderGeneric` from the `ZXing.NET` library:

    ```csharp
    public partial class CommunityToolkitCameraPage : ContentPage
    {
        private readonly IBarcodeReaderGeneric barcodeReader = new BarcodeReaderGeneric()
        {
            AutoRotate = true,
            Options = new DecodingOptions()
            {
                PossibleFormats = [BarcodeFormat.QR_CODE],
                TryHarder = true,
                TryInverted = true,
                PureBarcode = false
            }
        };

        public CommunityToolkitCameraPage()
        {
            InitializeComponent();
        }

        protected override async void OnAppearing()
        {
            base.OnAppearing();
            ToolkitCameraView.MediaCaptured += OnMediaCaptured;

            var cameras = await ToolkitCameraView.GetAvailableCameras(CancellationToken.None);
            ToolkitCameraView.SelectedCamera = cameras.FirstOrDefault(x => x.Position != CommunityToolkit.Maui.Core.Primitives.CameraPosition.Front);

            await ToolkitCameraView.StartCameraPreview(CancellationToken.None);
            PeriodicTimer timer = new(TimeSpan.FromMilliseconds(3000));
            while (await timer.WaitForNextTickAsync())
            {
                await ToolkitCameraView.CaptureImage(CancellationToken.None);
            }
        }

        private async void OnMediaCaptured(object? sender, MediaCapturedEventArgs e)
        {
            var image = (PlatformImage)PlatformImage.FromStream(e.Media);
            var result = barcodeReader.Decode(new ImageLuminanceSource(image));
            if (result is null)
            {
                return;
            }

            await MainThread.InvokeOnMainThreadAsync(async () =>
            {
                await Toast.Make(result.Text, ToastDuration.Long).Show();
            });
        }
    }
    ```

1. **Prepare the image for the Barcode Scanner**

    `BarcodeReaderGeneric` from the `ZXing.NET` library uses `LuminanceSource` as a source from the barcode analysis. Our task is to calculate luminance for the RGB bytes:

    ```csharp
    using Microsoft.Maui.Graphics.Platform;
    using ZXing;

    public class ImageLuminanceSource : RGBLuminanceSource
    {
        public ImageLuminanceSource(PlatformImage image)
            : this((int)image.Width, (int)image.Height)
        {

    #if ANDROID
            var pixels = new int[(int)image.Width * (int)image.Height];
            image.PlatformRepresentation.GetPixels(pixels, 0, (int)image.Width, 0, 0, (int)image.Width, (int)image.Height);
            var rgbRawBytes = new byte[pixels.Length * 4];
            Buffer.BlockCopy(pixels, 0, rgbRawBytes, 0, rgbRawBytes.Length);
    #elif IOS || MACCATALYST
            var pixels = new int[(int)image.Width * (int)image.Height];
            var rgbRawBytes = new byte[pixels.Length * 4];
    #elif WINDOWS
            var rgbRawBytes = image.PlatformRepresentation.GetPixelBytes();
    #else
            var pixels = new int[(int)image.Width * (int)image.Height];
            var rgbRawBytes = new byte[pixels.Length * 4];
    #endif

            CalculateLuminance(rgbRawBytes, BitmapFormat.RGB32);
        }

        protected ImageLuminanceSource(int width, int height)
            : base(width, height)
        {
        }

        protected override LuminanceSource CreateLuminanceSource(byte[] newLuminances, int width, int height)
        {
            return new ImageLuminanceSource(width, height) { luminances = newLuminances };
        }
    }
    ```

![CommunityToolkit.Maui.Camera](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/56/mct-camera.png)

### Conclusion

Each of these methods offers unique advantages depending on the specific requirements and target platforms of your .NET MAUI application. MLKit provides advanced machine learning capabilities for Android, Camera.MAUI.ZXing offers a built-in barcode scanner in a CameraView control and CommunityToolkit.MAUI.Camera provides the best CameraView control with the ability to plugin the barcode scanning functionality. By leveraging these tools, developers can implement robust and efficient barcode scanning functionality in their .NET MAUI applications.

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/MauiBarcode){target="_blank"}.

Happy coding!