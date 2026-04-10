import Contacts
import EventKit
import Foundation

struct BridgeContact: Codable {
    let id: String
    let name: String
    let email: String?
    let phone: String?
    let address: String?
}

struct BridgeEvent: Codable {
    let id: String
    let title: String
    let start: String
    let end: String
    let notes: String
    let personId: String?
}

struct HealthStatus: Codable {
    let mode: String
    let contactsAuthorization: Int
    let calendarAuthorization: Int
}

let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
encoder.dateEncodingStrategy = .iso8601

func writeJSON<T: Encodable>(_ value: T) throws {
    let data = try encoder.encode(value)
    FileHandle.standardOutput.write(data)
}

func usage() {
    let message = """
    Usage:
      MacOSBridgeCLI health
      MacOSBridgeCLI search-contacts <query>
      MacOSBridgeCLI list-events <calendarId>
    """
    print(message)
}

let args = CommandLine.arguments
guard args.count >= 2 else {
    usage()
    exit(1)
}

switch args[1] {
case "health":
    let health = HealthStatus(
        mode: "native",
        contactsAuthorization: CNContactStore.authorizationStatus(for: .contacts).rawValue,
        calendarAuthorization: EKEventStore.authorizationStatus(for: .event).rawValue
    )
    try writeJSON(health)
case "search-contacts":
    guard args.count >= 3 else {
        usage()
        exit(1)
    }
    let query = args[2].lowercased()
    let store = CNContactStore()
    let keys: [CNKeyDescriptor] = [
        CNContactIdentifierKey as CNKeyDescriptor,
        CNContactFormatter.descriptorForRequiredKeys(for: .fullName),
        CNContactEmailAddressesKey as CNKeyDescriptor,
        CNContactPhoneNumbersKey as CNKeyDescriptor,
        CNContactPostalAddressesKey as CNKeyDescriptor
    ]
    var matches: [BridgeContact] = []
    let request = CNContactFetchRequest(keysToFetch: keys)
    try store.enumerateContacts(with: request) { contact, _ in
        let name = CNContactFormatter.string(from: contact, style: .fullName) ?? "Unknown"
        guard name.lowercased().contains(query) else {
            return
        }
        let email = contact.emailAddresses.first?.value as String?
        let phone = contact.phoneNumbers.first?.value.stringValue
        let address = contact.postalAddresses.first.map { entry in
            let postal = entry.value
            return [postal.street, postal.city, postal.postalCode].filter { !$0.isEmpty }.joined(separator: ", ")
        }
        matches.append(BridgeContact(id: contact.identifier, name: name, email: email, phone: phone, address: address))
    }
    try writeJSON(matches)
case "list-events":
    guard args.count >= 3 else {
        usage()
        exit(1)
    }
    let calendarId = args[2]
    let store = EKEventStore()
    let calendars = store.calendars(for: .event).filter { $0.calendarIdentifier == calendarId }
    guard let calendar = calendars.first else {
        try writeJSON([BridgeEvent]())
        exit(0)
    }
    let start = Date().addingTimeInterval(-60 * 60 * 24 * 30)
    let end = Date().addingTimeInterval(60 * 60 * 24 * 120)
    let predicate = store.predicateForEvents(withStart: start, end: end, calendars: [calendar])
    let events = store.events(matching: predicate).map { event in
        BridgeEvent(
            id: event.eventIdentifier,
            title: event.title ?? "Untitled",
            start: ISO8601DateFormatter().string(from: event.startDate),
            end: ISO8601DateFormatter().string(from: event.endDate),
            notes: event.notes ?? "",
            personId: nil
        )
    }
    try writeJSON(events)
default:
    usage()
    exit(1)
}
