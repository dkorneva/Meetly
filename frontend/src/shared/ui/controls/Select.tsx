import { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { Text, useTheme } from "../../theme";
import { Icon } from "../Icon";

/** Выпадающий список: системный select в браузере, доступное окно выбора на телефоне. */
export function Select({label,value,options,onChange,accessibilityLabel=label}:{
  label:string;value:string;options:string[];onChange:(value:string)=>void;accessibilityLabel?:string;
}) {
  const {colors}=useTheme();
  const [open,setOpen]=useState(false);
  const [focused,setFocused]=useState(false);
  return <View style={{flex:1,minWidth:0,gap:5}}>
    <Text style={{fontSize:12,color:colors.textSecondary,fontWeight:"400"}}>{label}</Text>
    <View style={{height:40,borderRadius:10,borderWidth:1,borderColor:focused||open?colors.primary:colors.selectedBorder,backgroundColor:colors.surfaceRaised,overflow:"hidden"}}>
      {Platform.OS==="web" ? <select aria-label={accessibilityLabel} value={value}
        onChange={event=>onChange(event.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{appearance:"none",width:"100%",height:"100%",border:0,outline:"none",backgroundColor:"transparent",color:colors.text,padding:"0 30px 0 12px",fontFamily:"Inter, system-ui, sans-serif",fontSize:16,fontWeight:400,fontVariantNumeric:"tabular-nums",cursor:"pointer"}}>
        {options.map(option=><option key={option} value={option} style={{background:colors.surface,color:colors.text}}>{option}</option>)}
      </select> : <Pressable accessibilityRole="combobox" accessibilityLabel={accessibilityLabel} accessibilityState={{expanded:open}}
        onPress={()=>setOpen(true)} style={{flex:1,justifyContent:"center",paddingHorizontal:12}}>
        <Text style={{fontSize:16,fontWeight:"400",color:colors.text}}>{value}</Text>
      </Pressable>}
      <View pointerEvents="none" style={{position:"absolute",right:10,top:13,transform:[{rotate:"90deg"}]}}><Icon name="chevron" size={14} color={colors.textSecondary}/></View>
    </View>
    {Platform.OS!=="web" && <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}>
      <Pressable accessibilityLabel="Закрыть список" onPress={()=>setOpen(false)} style={{flex:1,backgroundColor:"rgba(20,24,42,.35)",justifyContent:"center",alignItems:"center",padding:28}}>
        <Pressable onPress={event=>event.stopPropagation()} style={{width:"100%",maxWidth:320,maxHeight:"65%",backgroundColor:colors.surface,borderRadius:20,padding:16}}>
          <Text style={{fontSize:17,fontWeight:"600",marginBottom:12}}>{label}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
            {options.map(option=><Pressable key={option} accessibilityRole="button" accessibilityLabel={option} accessibilityState={{selected:option===value}}
              onPress={()=>{onChange(option);setOpen(false)}} style={{padding:14,borderRadius:10,backgroundColor:option===value?colors.selectedSurface:"transparent",flexDirection:"row",justifyContent:"space-between"}}>
              <Text style={{fontSize:16,fontWeight:"400",color:option===value?colors.primaryText:colors.text}}>{option}</Text>
              {option===value&&<Icon name="check" size={18} color={colors.primaryText}/>}
            </Pressable>)}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>}
  </View>;
}
