import SwiftUI

@main
struct WeekendDotsApp: App {
    @State private var store = WeekendStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(store)
        }
    }
}
