window.JsFunctions = {
    acceptMessage: function (cookieString) {
        document.cookie = cookieString;
    },
    initAds: function () {
        try {
            (adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {

        }
    }
};