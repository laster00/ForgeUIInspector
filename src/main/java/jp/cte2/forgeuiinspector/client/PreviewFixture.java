package jp.cte2.forgeuiinspector.client;

import java.util.ArrayList;
import java.util.List;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.network.chat.Component;

/** Deterministic, network-free data used by the visual inspector. */
public enum PreviewFixture {
    NORMAL("screen.forgeuiinspector.normal", 18), EMPTY("screen.forgeuiinspector.empty", 0), MANY("screen.forgeuiinspector.many", 108), OTHER("screen.forgeuiinspector.other", 7);

    private final String translationKey;
    private final int entries;
    PreviewFixture(String translationKey, int entries) { this.translationKey = translationKey; this.entries = entries; }
    public String translationKey() { return translationKey; }
    public int entries() { return entries; }
    public int pageCount() { return pageCountFor(entries); }
    public int pageCountFor(int count) { return Math.max(1, (count + Cte2StashPreviewGeometry.PAGE_SIZE - 1) / Cte2StashPreviewGeometry.PAGE_SIZE); }
    public List<Component> layoutLabels() {
        List<Component> result = new ArrayList<>();
        result.add(Component.translatable("screen.forgeuiinspector.all"));
        for (int i = 1; i <= 28; i++) result.add(i == 1 ? Component.translatable("screen.forgeuiinspector.layout.long") : Component.translatable("screen.forgeuiinspector.layout", String.format("%02d", i)));
        result.add(Component.translatable("screen.forgeuiinspector.other"));
        return result;
    }
    public Component layoutLabel(int index) { return layoutLabels().get(Math.max(0, Math.min(index, layoutLabels().size() - 1))); }
    public int countForLayout(int index) { if (index == 0) return entries; if (index == layoutLabels().size() - 1) return Math.max(0, entries / 7); return entries == 0 ? 0 : (index * 3 + entries) % 11 + 1; }
    public ItemStack item(int index) {
        if (entries == 0) return ItemStack.EMPTY;
        return new ItemStack(index % 3 == 0 ? Items.MAP : index % 3 == 1 ? Items.PAPER : Items.COMPASS, (index % 12) + 1);
    }
}
