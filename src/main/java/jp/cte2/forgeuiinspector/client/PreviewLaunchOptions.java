package jp.cte2.forgeuiinspector.client;

/** Deterministic, local-only launch options supplied by the capture harness. */
final class PreviewLaunchOptions {
    private PreviewLaunchOptions() { }

    static int fixtureIndex() {
        return switch (System.getProperty("forgeuiinspector.fixture", "normal")) {
            case "empty" -> 1;
            case "many" -> 2;
            case "other" -> 3;
            default -> 0;
        };
    }
}
