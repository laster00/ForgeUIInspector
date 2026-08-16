package jp.cte2.forgeuiinspector.client;

import com.mojang.blaze3d.platform.InputConstants;
import net.minecraft.client.KeyMapping;
import net.minecraft.client.Minecraft;
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.client.event.RegisterKeyMappingsEvent;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;
import org.lwjgl.glfw.GLFW;

@Mod.EventBusSubscriber(modid = "forgeuiinspector", value = Dist.CLIENT, bus = Mod.EventBusSubscriber.Bus.MOD)
public final class ForgeUIInspectorClient {
    private static KeyMapping openKey;
    private ForgeUIInspectorClient() { }
    @SubscribeEvent
    public static void registerKeys(RegisterKeyMappingsEvent event) {
        openKey = new KeyMapping("key.forgeuiinspector.open", InputConstants.Type.KEYSYM, GLFW.GLFW_KEY_F8, "key.categories.misc");
        event.register(openKey);
    }
    @Mod.EventBusSubscriber(modid = "forgeuiinspector", value = Dist.CLIENT, bus = Mod.EventBusSubscriber.Bus.FORGE)
    public static final class ClientEvents {
        @SubscribeEvent
        public static void clientTick(TickEvent.ClientTickEvent event) {
            if (event.phase == TickEvent.Phase.END && openKey != null && openKey.consumeClick()) {
                Minecraft mc = Minecraft.getInstance();
                if (mc.level != null) mc.setScreen(new MapStashPreviewScreen(mc.screen));
            }
        }
    }
}
