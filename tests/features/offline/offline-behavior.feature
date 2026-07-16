Feature: Offline behavior

  Background: wallet is onboarded and connected to KERIA
    Given user is on the intro screen
    When user taps "Get started" button
    Then user is on the Terms and Privacy screen
    When user taps "I accept" button
    Then user can see Passcode screen
    When user generate passcode on Passcode screen
    Then user can see "Enable biometrics" title
    When user skip Biometric popup if it exist
    Then user can see "Create a password" title
    When user taps "Set up later" button
    And user confirms skip password
    And user is on Connect to Veridian screen
    Then user navigates to SSI Agent Advanced Setup screen
    When user enters boot URL "default"
    And user enters connect URL "default"
    And user tap Validate button on SSI Agent Details screen
    Then user can see Profile type screen
    When user selects Individual profile option
    And user taps Confirm button on Profile type screen
    Then user can see Profile setup screen
    When user enters username "OfflineUser1"
    And user taps Confirm button on Profile setup screen
    Then user can see Welcome screen with username "OfflineUser1"
    When user taps Continue button on Welcome screen
    Then user can see Homepage

  @offline @e2e @backend-outage
  Scenario: App shows offline page when KERIA becomes unreachable and recovers when it returns
    When the KERIA backend goes down
    Then user can see the App Offline page
    When the KERIA backend comes back up
    Then the App Offline page disappears
    And user can see Homepage

  @offline @e2e @device-network
  Scenario: App shows offline page when device loses network connectivity and recovers
    When the device network is disabled
    Then user can see the App Offline page
    When the device network is enabled
    Then the App Offline page disappears
    And user can see Homepage
