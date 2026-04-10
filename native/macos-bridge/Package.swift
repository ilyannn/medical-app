// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "macos-bridge",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(name: "MacOSBridgeCLI", targets: ["MacOSBridgeCLI"])
    ],
    targets: [
        .executableTarget(
            name: "MacOSBridgeCLI",
            path: "Sources/MacOSBridgeCLI"
        )
    ]
)
