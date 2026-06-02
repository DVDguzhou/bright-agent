import UIKit
import Capacitor
import AppTrackingTransparency

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var didRequestTrackingAuthorization = false
    /// 与网站 --paper (#f4efe6) 一致；contentInset 留白与下拉回弹会露出 window 底色
    private let paperBackground = UIColor(red: 244 / 255, green: 239 / 255, blue: 230 / 255, alpha: 1)

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        window?.backgroundColor = paperBackground
        return true
    }

    /// App Store 5.1.2: ATT must run while UIApplicationState is active (not from WebView on first paint).
    private func requestTrackingAuthorizationIfNeeded() {
        guard !didRequestTrackingAuthorization else { return }
        guard #available(iOS 14, *) else { return }
        guard ATTrackingManager.trackingAuthorizationStatus == .notDetermined else { return }

        didRequestTrackingAuthorization = true
        ATTrackingManager.requestTrackingAuthorization { _ in }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        requestTrackingAuthorizationIfNeeded()
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Handle Universal Links - capacitor-swift-pm's ApplicationDelegateProxy may not expose this API
        if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
           let url = userActivity.webpageURL {
            NotificationCenter.default.post(
                name: Notification.Name("capacitorOpenUniversalLink"),
                object: ["url": url]
            )
            restorationHandler([])
            return true
        }
        restorationHandler(nil)
        return false
    }

}
