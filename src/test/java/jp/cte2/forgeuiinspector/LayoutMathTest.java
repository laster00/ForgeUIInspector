package jp.cte2.forgeuiinspector;

import jp.cte2.forgeuiinspector.client.LayoutMath;
import jp.cte2.forgeuiinspector.client.PreviewFixture;
import jp.cte2.forgeuiinspector.client.CurrencyPreviewFixture;
import jp.cte2.forgeuiinspector.client.Cte2StashPreviewGeometry;
import org.junit.Test;
import static org.junit.Assert.*;

public class LayoutMathTest {
    @Test public void scrollAndPagesAreClamped() {
        assertEquals(0, LayoutMath.clampScroll(-4, 28, 10));
        assertEquals(18, LayoutMath.clampScroll(99, 28, 10));
        assertEquals(1, LayoutMath.pageFor(97, Cte2StashPreviewGeometry.PAGE_SIZE, 9));
    }
    @Test public void fixturesAreDeterministic() {
        assertEquals(30, PreviewFixture.NORMAL.layoutLabels().size());
        assertEquals(18, PreviewFixture.NORMAL.countForLayout(0));
        assertEquals(108, PreviewFixture.MANY.entries());
        assertEquals(2, PreviewFixture.MANY.pageCount());
        assertEquals(1, PreviewFixture.NORMAL.pageCountFor(96));
        assertEquals(2, PreviewFixture.NORMAL.pageCountFor(97));
        assertEquals(2, PreviewFixture.MANY.pageCountFor(97));
        assertEquals(1, CurrencyPreviewFixture.NORMAL.pageCountFor(96));
        assertEquals(2, CurrencyPreviewFixture.NORMAL.pageCountFor(97));
        assertEquals(0, PreviewFixture.EMPTY.entries());
    }
}
