package jp.cte2.forgeuiinspector.client;

import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.ItemStack;

/** Compact 320x230 currency stash preview; intentionally independent of MapStashPreviewScreen. */
public final class CurrencyStashPreviewScreen extends Screen {
    private static final int W = 320, H = 230; private final Screen parent;
    private CurrencyPreviewFixture fixture = CurrencyPreviewFixture.NORMAL; private int fixtureIndex, category, page, scroll; private float scale = 1; private int ox, oy;
    public CurrencyStashPreviewScreen(Screen parent) { super(Component.translatable("screen.forgeuiinspector.currency.title")); this.parent = parent; }
    @Override protected void init() { scale = Math.min(1, Math.min(width / (float) W, height / (float) H)); ox = Math.round((width - W * scale) / 2); oy = Math.round((height - H * scale) / 2); }
    @Override public void render(GuiGraphics g, int mx, int my, float partial) { renderBackground(g); g.pose().pushPose(); g.pose().translate(ox, oy, 0); g.pose().scale(scale, scale, 1); g.fill(0, 0, W, H, 0xff202124); g.fill(1, 1, W - 1, 20, 0xff383b40); g.drawString(font, title, 8, 6, 0xffffff, false); g.fill(216, 3, 313, 18, 0xff4b5260); Component fixtureText = Component.translatable("screen.forgeuiinspector.fixture", Component.translatable(fixture.translationKey())); g.drawString(font, font.substrByWidth(fixtureText, 90).getString(), 220, 6, 0xffffff, false); g.fill(4, 24, 119, 214, 0xff151619); drawCategories(g); drawSlots(g); drawInventory(g); g.pose().popPose(); super.render(g, mx, my, partial); }
    private void drawCategories(GuiGraphics g) { var names = fixture.categories(); scroll = LayoutMath.clampScroll(scroll, names.size(), 6); for (int row = 0; row < 6 && row + scroll < names.size(); row++) { int i = row + scroll, y = 29 + row * 17; if (i == category) g.fill(6, y - 2, 116, y + 13, 0xff4b5260); g.drawString(font, font.substrByWidth(names.get(i), 80).getString(), 8, y, 0xe8e8e8, false); } }
    private void drawSlots(GuiGraphics g) { int x = 125, y = 32, count = fixture.categoryCount(category), pages = fixture.pageCountForCategory(category), shown = Math.min(54, Math.max(0, count - page * 54)); for (int i = 0; i < 54; i++) { int sx = x + (i % 9) * 18, sy = y + (i / 9) * 18; g.fill(sx, sy, sx + 17, sy + 17, 0xff8b8b8b); g.fill(sx + 1, sy + 1, sx + 16, sy + 16, 0xff373737); if (i < shown) { ItemStack stack = fixture.itemForCategory(category, page * 54 + i); g.renderItem(stack, sx + 1, sy + 1); g.renderItemDecorations(font, stack, sx + 1, sy + 1); } } if (pages > 1) g.drawString(font, Component.translatable("screen.forgeuiinspector.page", page + 1, pages), 226, 24, 0xffffff, false); }
    private void drawInventory(GuiGraphics g) { int x = 125, y = 145; g.drawString(font, Component.translatable("container.inventory"), x, y - 11, 0xffbdbdbd, false); for (int i = 0; i < 36; i++) { int sx = x + i % 9 * 18, sy = y + i / 9 * 18; g.fill(sx, sy, sx + 17, sy + 17, 0xff8b8b8b); g.fill(sx + 1, sy + 1, sx + 16, sy + 16, 0xff373737); } }
    private double lx(double x) { return (x - ox) / scale; } private double ly(double y) { return (y - oy) / scale; }
    private void next(int step) { fixtureIndex = (fixtureIndex + step + 4) % 4; fixture = CurrencyPreviewFixture.values()[fixtureIndex]; category = page = scroll = 0; }
    @Override public boolean mouseScrolled(double mx, double my, double amount) { if (lx(mx) < 120) scroll += amount > 0 ? -1 : 1; else page += amount > 0 ? -1 : 1; page = Math.max(0, Math.min(fixture.pageCountForCategory(category) - 1, page)); return true; }
    @Override public boolean mouseClicked(double mx, double my, int button) { double x = lx(mx), y = ly(my); if (x >= 216 && x < 314 && y >= 2 && y < 20) { next(1); return true; } if (x >= 4 && x < 119 && y >= 24 && y < 214) { category = Math.max(0, Math.min(8, (int)((y - 24) / 17) + scroll)); page = 0; return true; } return super.mouseClicked(mx, my, button); }
    @Override public boolean keyPressed(int key, int scan, int modifiers) { if (key == 256) { onClose(); return true; } if (key == 262) { next(1); return true; } if (key == 263) { next(-1); return true; } return super.keyPressed(key, scan, modifiers); }
    @Override public void onClose() { Minecraft.getInstance().setScreen(parent); }
}
