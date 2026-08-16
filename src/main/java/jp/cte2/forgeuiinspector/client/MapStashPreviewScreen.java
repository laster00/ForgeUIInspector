package jp.cte2.forgeuiinspector.client;

import java.util.List;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.ItemStack;

/** Local-only preview on a 320x230 logical canvas, scaled for small windows. */
public final class MapStashPreviewScreen extends Screen {
    private static final int W = 320, H = 230;
    private final Screen parent;
    private PreviewFixture fixture = PreviewFixture.NORMAL;
    private int fixtureIndex, selectedLayout, scroll, page, originX, originY;
    private float scale = 1;
    public MapStashPreviewScreen(Screen parent) { super(Component.translatable("screen.forgeuiinspector.title")); this.parent = parent; }
    @Override protected void init() { scale = Math.min(1, Math.min(width / (float) W, height / (float) H)); originX = Math.round((width - W * scale) / 2); originY = Math.round((height - H * scale) / 2); }
    @Override public void render(GuiGraphics g, int mouseX, int mouseY, float partialTick) {
        renderBackground(g); g.pose().pushPose(); g.pose().translate(originX, originY, 0); g.pose().scale(scale, scale, 1);
        g.fill(0, 0, W, H, 0xff202124); g.fill(1, 1, W - 1, 20, 0xff383b40); g.drawString(font, title, 8, 6, 0xffffff, false);
        g.fill(216, 3, 313, 18, 0xff4b5260); Component fixtureText = Component.translatable("screen.forgeuiinspector.fixture", Component.translatable(fixture.translationKey())); g.drawString(font, font.substrByWidth(fixtureText, 90).getString(), 220, 6, 0xffffff, false);
        drawLayoutList(g); drawStash(g); drawPlayerInventory(g); g.pose().popPose(); super.render(g, mouseX, mouseY, partialTick);
    }
    private void drawLayoutList(GuiGraphics g) {
        int x = 7, y = 27; g.fill(4, 24, 119, 214, 0xff151619); List<Component> names = fixture.layoutLabels(); int visible = 10; scroll = LayoutMath.clampScroll(scroll, names.size(), visible);
        for (int row = 0; row < visible && row + scroll < names.size(); row++) { int index = row + scroll, yy = y + row * 17; if (index == selectedLayout) g.fill(6, yy - 2, 116, yy + 13, 0xff4b5260); String clipped = font.substrByWidth(names.get(index), 78).getString(); g.drawString(font, clipped, x, yy, 0xe8e8e8, false); g.drawString(font, Integer.toString(fixture.countForLayout(index)), 95, yy, 0xffb0b0b0, false); }
    }
    private void drawStash(GuiGraphics g) {
        int x = 125, y = 32; String heading = font.substrByWidth(fixture.layoutLabel(selectedLayout), 96).getString() + " (" + fixture.countForLayout(selectedLayout) + ")"; g.drawString(font, heading, x, 24, 0xffd9d9d9, false);
        int selectedCount = selectedCount(); int shown = Math.min(54, Math.max(0, selectedCount - page * 54));
        for (int i = 0; i < 54; i++) { int sx = x + (i % 9) * 18, sy = y + (i / 9) * 18; g.fill(sx, sy, sx + 17, sy + 17, 0xff8b8b8b); g.fill(sx + 1, sy + 1, sx + 16, sy + 16, 0xff373737); if (i < shown) { ItemStack stack = fixture.item(page * 54 + i); g.renderItem(stack, sx + 1, sy + 1); g.renderItemDecorations(font, stack, sx + 1, sy + 1); } }
        int pages = fixture.pageCountFor(selectedCount); if (pages > 1) g.drawString(font, Component.translatable("screen.forgeuiinspector.page", page + 1, pages), 226, 24, 0xffffff, false);
    }
    private void drawPlayerInventory(GuiGraphics g) { int x = 125, y = 145; g.drawString(font, Component.translatable("container.inventory"), x, y - 11, 0xffbdbdbd, false); for (int i = 0; i < 36; i++) drawSlot(g, x + (i % 9) * 18, y + (i / 9) * 18, i < 27 ? ItemStack.EMPTY : new ItemStack(i % 2 == 0 ? net.minecraft.world.item.Items.BREAD : net.minecraft.world.item.Items.TORCH, 1)); }
    private void drawSlot(GuiGraphics g, int x, int y, ItemStack stack) { g.fill(x, y, x + 17, y + 17, 0xff8b8b8b); g.fill(x + 1, y + 1, x + 16, y + 16, 0xff373737); if (!stack.isEmpty()) { g.renderItem(stack, x + 1, y + 1); g.renderItemDecorations(font, stack, x + 1, y + 1); } }
    private double lx(double x) { return (x - originX) / scale; } private double ly(double y) { return (y - originY) / scale; }
    private int selectedCount() { return fixture.countForLayout(selectedLayout); }
    @Override public boolean mouseScrolled(double mx, double my, double amount) { if (lx(mx) < 120 && ly(my) >= 24 && ly(my) < 214) scroll += amount > 0 ? -1 : 1; else if (fixture.pageCountFor(selectedCount()) > 1) page += amount > 0 ? -1 : 1; page = LayoutMath.pageFor(selectedCount(), 54, page); return true; }
    @Override public boolean mouseClicked(double mx, double my, int button) { double x = lx(mx), y = ly(my); if (x >= 216 && x < 314 && y >= 2 && y < 20) { nextFixture(); return true; } if (x >= 4 && x < 118 && y >= 24 && y < 198) { int row = (int)((y - 24) / 17) + scroll; if (row >= 0 && row < fixture.layoutLabels().size()) { selectedLayout = row; page = 0; } return true; } return super.mouseClicked(mx, my, button); }
    private void nextFixture() { fixtureIndex = (fixtureIndex + 1) % 4; fixture = PreviewFixture.values()[fixtureIndex]; selectedLayout = scroll = page = 0; }
    @Override public boolean keyPressed(int keyCode, int scanCode, int modifiers) { if (keyCode == 256) { onClose(); return true; } if (keyCode == 262) { nextFixture(); return true; } if (keyCode == 263) { fixtureIndex = (fixtureIndex + 3) % 4; fixture = PreviewFixture.values()[fixtureIndex]; selectedLayout = scroll = page = 0; return true; } return super.keyPressed(keyCode, scanCode, modifiers); }
    @Override public void onClose() { Minecraft.getInstance().setScreen(parent); }
}
