import Foundation
import SwiftUI

struct Category: Identifiable, Codable, Hashable {
    var id: UUID
    var name: String
    var colorHex: String
    var emoji: String

    init(id: UUID = UUID(), name: String, colorHex: String, emoji: String) {
        self.id = id
        self.name = name
        self.colorHex = colorHex
        self.emoji = emoji
    }

    var color: Color {
        Color(hex: colorHex)
    }

    static let defaults: [Category] = [
        Category(name: "旅行", colorHex: "#FF6B6B", emoji: "✈️"),
        Category(name: "趣味", colorHex: "#4ECDC4", emoji: "🎨"),
        Category(name: "家族", colorHex: "#FFE66D", emoji: "👨‍👩‍👧‍👦"),
        Category(name: "勉強", colorHex: "#95E1D3", emoji: "📚"),
        Category(name: "運動", colorHex: "#F38181", emoji: "🏃"),
        Category(name: "休息", colorHex: "#AA96DA", emoji: "😴"),
        Category(name: "友達", colorHex: "#FCBAD3", emoji: "🍻"),
    ]
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        let scanner = Scanner(string: hex)
        var rgbValue: UInt64 = 0
        scanner.scanHexInt64(&rgbValue)

        let r = Double((rgbValue & 0xFF0000) >> 16) / 255.0
        let g = Double((rgbValue & 0x00FF00) >> 8) / 255.0
        let b = Double(rgbValue & 0x0000FF) / 255.0

        self.init(red: r, green: g, blue: b)
    }
}
