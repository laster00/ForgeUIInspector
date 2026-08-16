package jp.cte2.forgeuiinspector;

import com.mojang.logging.LogUtils;
import net.minecraftforge.fml.common.Mod;
import org.slf4j.Logger;

@Mod(ForgeUIInspector.MOD_ID)
public final class ForgeUIInspector {
    public static final String MOD_ID = "forgeuiinspector";
    public static final Logger LOGGER = LogUtils.getLogger();
    public ForgeUIInspector() { }
}
