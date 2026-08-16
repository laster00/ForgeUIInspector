package jp.cte2.forgeuiinspector;

import jp.cte2.forgeuiinspector.client.LayoutMath;
import jp.cte2.forgeuiinspector.client.PreviewFixture;
import org.junit.Test;
import static org.junit.Assert.*;

public class LayoutMathTest {
    @Test public void scrollAndPagesAreClamped() {
        assertEquals(0, LayoutMath.clampScroll(-4, 28, 10));
        assertEquals(18, LayoutMath.clampScroll(99, 28, 10));
        assertEquals(1, LayoutMath.pageFor(92, 54, 9));
    }
    @Test public void fixturesAreDeterministic() {
        assertEquals(30, PreviewFixture.NORMAL.layoutLabels().size());
        assertEquals(18, PreviewFixture.NORMAL.countForLayout(0));
        assertEquals(2, PreviewFixture.MANY.pageCount());
        assertEquals(2, PreviewFixture.MANY.pageCountFor(92));
        assertEquals(0, PreviewFixture.EMPTY.entries());
    }
}
