import SwiftUI

struct CategoryManagerView: View {
    @Environment(WeekendStore.self) private var store
    @State private var showingAddSheet = false
    @State private var editingCategory: Category?

    var body: some View {
        NavigationStack {
            List {
                Section {
                    ForEach(store.categories) { category in
                        HStack {
                            Circle()
                                .fill(category.color)
                                .frame(width: 24, height: 24)

                            Text(category.emoji)
                                .font(.title3)

                            Text(category.name)
                                .font(.body)

                            Spacer()

                            Text("\(store.daysForCategory(category))日")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .monospacedDigit()
                        }
                        .contentShape(Rectangle())
                        .onTapGesture {
                            editingCategory = category
                        }
                    }
                    .onDelete { indexSet in
                        for index in indexSet {
                            store.deleteCategory(store.categories[index])
                        }
                    }
                } header: {
                    Text("カテゴリ一覧")
                } footer: {
                    Text("左スワイプで削除、タップで編集できます")
                }
            }
            .navigationTitle("カテゴリ")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingAddSheet = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddSheet) {
                CategoryEditView(mode: .add)
                    .presentationDetents([.medium])
            }
            .sheet(item: $editingCategory) { category in
                CategoryEditView(mode: .edit(category))
                    .presentationDetents([.medium])
            }
        }
    }
}

// MARK: - Category Edit View

struct CategoryEditView: View {
    enum Mode {
        case add
        case edit(Category)
    }

    @Environment(WeekendStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    let mode: Mode

    @State private var name: String = ""
    @State private var emoji: String = ""
    @State private var selectedColor: String = "#FF6B6B"

    private let colorOptions = [
        "#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3",
        "#F38181", "#AA96DA", "#FCBAD3", "#A8E6CF",
        "#FFD93D", "#6C5CE7", "#74B9FF", "#FD79A8",
        "#00B894", "#E17055", "#0984E3", "#636E72",
    ]

    var body: some View {
        NavigationStack {
            Form {
                Section("カテゴリ名") {
                    TextField("例: 旅行", text: $name)
                }

                Section("絵文字") {
                    TextField("例: ✈️", text: $emoji)
                        .onChange(of: emoji) { _, newValue in
                            // Keep only the last character (emoji)
                            if newValue.count > 1 {
                                emoji = String(newValue.suffix(1))
                            }
                        }
                }

                Section("色") {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 8), spacing: 8) {
                        ForEach(colorOptions, id: \.self) { hex in
                            Circle()
                                .fill(Color(hex: hex))
                                .frame(width: 32, height: 32)
                                .overlay(
                                    Circle()
                                        .strokeBorder(.primary, lineWidth: selectedColor == hex ? 3 : 0)
                                )
                                .onTapGesture {
                                    selectedColor = hex
                                }
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle(isEditing ? "カテゴリ編集" : "カテゴリ追加")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("キャンセル") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("保存") {
                        saveCategory()
                        dismiss()
                    }
                    .disabled(name.isEmpty || emoji.isEmpty)
                }
            }
            .onAppear {
                if case .edit(let category) = mode {
                    name = category.name
                    emoji = category.emoji
                    selectedColor = category.colorHex
                }
            }
        }
    }

    private var isEditing: Bool {
        if case .edit = mode { return true }
        return false
    }

    private func saveCategory() {
        switch mode {
        case .add:
            let category = Category(name: name, colorHex: selectedColor, emoji: emoji)
            store.addCategory(category)
        case .edit(var category):
            category.name = name
            category.emoji = emoji
            category.colorHex = selectedColor
            store.updateCategory(category)
        }
    }
}
