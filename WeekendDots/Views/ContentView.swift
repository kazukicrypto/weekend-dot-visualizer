import SwiftUI

struct ContentView: View {
    @Environment(WeekendStore.self) private var store

    var body: some View {
        TabView {
            DotGridView()
                .tabItem {
                    Label("ドット", systemImage: "circle.grid.3x3.fill")
                }

            SummaryView()
                .tabItem {
                    Label("まとめ", systemImage: "chart.pie.fill")
                }

            CategoryManagerView()
                .tabItem {
                    Label("カテゴリ", systemImage: "tag.fill")
                }
        }
        .tint(.primary)
    }
}
