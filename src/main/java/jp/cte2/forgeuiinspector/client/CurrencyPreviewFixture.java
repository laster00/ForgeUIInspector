package jp.cte2.forgeuiinspector.client;

import java.util.List;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;

/** Deterministic vanilla-only currency fixture for the UI prototype. */
public enum CurrencyPreviewFixture {
    NORMAL("screen.forgeuiinspector.currency.normal", 18), EMPTY("screen.forgeuiinspector.currency.empty", 0), MANY("screen.forgeuiinspector.currency.many", 108), OTHER("screen.forgeuiinspector.currency.other", 6);
    private final String key; private final int entries;
    CurrencyPreviewFixture(String key, int entries) { this.key = key; this.entries = entries; }
    public String translationKey() { return key; }
    public int pageCountFor(int count) { return Math.max(1, (count + Cte2StashPreviewGeometry.PAGE_SIZE - 1) / Cte2StashPreviewGeometry.PAGE_SIZE); }
    public int pageCount() { return pageCountFor(entries); }
    public int categoryCount(int category) { if (category == 0) return entries; if (entries == 0) return 0; int count = 0; for (int i = 0; i < entries; i++) if (categoryFor(i) == category) count++; return count; }
    public int pageCountForCategory(int category) { return Math.max(1, (categoryCount(category) + Cte2StashPreviewGeometry.PAGE_SIZE - 1) / Cte2StashPreviewGeometry.PAGE_SIZE); }
    public ItemStack itemForCategory(int category, int index) { if (category == 0) return item(index); int found = 0; for (int i = 0; i < entries; i++) if (categoryFor(i) == category && found++ == index) return item(i); return ItemStack.EMPTY; }
    private int categoryFor(int index) { return this == OTHER ? 8 : 1 + (index % 8); }
    public List<Component> categories() { return List.of(Component.translatable("screen.forgeuiinspector.all"), Component.translatable("screen.forgeuiinspector.gear_orbs"), Component.translatable("screen.forgeuiinspector.map_orbs"), Component.translatable("screen.forgeuiinspector.gem_orbs"), Component.translatable("screen.forgeuiinspector.seeds"), Component.translatable("screen.forgeuiinspector.special_currency"), Component.translatable("screen.forgeuiinspector.prophecy"), Component.translatable("screen.forgeuiinspector.coins"), Component.translatable("screen.forgeuiinspector.other")); }
    public ItemStack item(int index) { if (entries == 0 || index >= entries) return ItemStack.EMPTY; return new ItemStack(switch (index % 7) { case 0 -> Items.AMETHYST_SHARD; case 1 -> Items.GOLD_INGOT; case 2 -> Items.EMERALD; case 3 -> Items.DIAMOND; case 4 -> Items.IRON_INGOT; case 5 -> Items.PAPER; default -> Items.BLAZE_POWDER; }, (index % 32) + 1); }
}
