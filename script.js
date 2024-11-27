const groupData = [];
let editMode = null;

const dataPointTypes = [
{ id: "DPST-1-001", name: "DPT_Switch" },
{ id: "DPST-1-002", name: "DPT_Bool" },
{ id: "DPST-1-003", name: "DPT_Enable" },
{ id: "DPST-1-004", name: "DPT_Ramp" },
{ id: "DPST-1-005", name: "DPT_Alarm" },
{ id: "DPST-1-006", name: "DPT_BinaryValue" },
{ id: "DPST-1-007", name: "DPT_Step" },
{ id: "DPST-1-008", name: "DPT_UpDown" },
{ id: "DPST-1-009", name: "DPT_OpenClose" },
{ id: "DPST-1-010", name: "DPT_Start" },
{ id: "DPST-1-011", name: "DPT_State" },
{ id: "DPST-1-012", name: "DPT_Invert" },
{ id: "DPST-1-013", name: "DPT_DimSendStyle" },
{ id: "DPST-1-014", name: "DPT_InputSource" },
{ id: "DPST-1-015", name: "DPT_Reset" },
{ id: "DPST-1-016", name: "DPT_Ack" },
{ id: "DPST-1-017", name: "DPT_Trigger" },
{ id: "DPST-1-018", name: "DPT_Occupancy" },
{ id: "DPST-1-019", name: "DPT_Window_Door" },
{ id: "DPST-1-021", name: "DPT_LogicalFunction" },
{ id: "DPST-1-022", name: "DPT_Scene_AB" },
{ id: "DPST-1-023", name: "DPT_ShutterBlinds_Mode" },
{ id: "DPST-1-100", name: "DPT_Heat/Cool" },
{ id: "DPST-2-001", name: "DPT_Switch_Control" },
{ id: "DPST-2-002", name: "DPT_Bool_Control" },
{ id: "DPST-2-003", name: "DPT_Enable_Control" },
{ id: "DPST-2-004", name: "DPT_Ramp_Control" },
{ id: "DPST-2-005", name: "DPT_Alarm_Control" },
{ id: "DPST-2-006", name: "DPT_BinaryValue_Control" },
{ id: "DPST-2-007", name: "DPT_Step_Control" },
{ id: "DPST-2-008", name: "DPT_Direction1_Control" },
{ id: "DPST-2-009", name: "DPT_Direction2_Control" },
{ id: "DPST-2-010", name: "DPT_Start_Control" },
{ id: "DPST-2-011", name: "DPT_State_Control" },
{ id: "DPST-2-012", name: "DPT_Invert_Control" },
{ id: "DPST-3-007", name: "DPT_Control_Dimming" },
{ id: "DPST-3-008", name: "DPT_Control_Blinds" },
{ id: "DPST-4-001", name: "DPT_Char_ASCII" },
{ id: "DPST-4-002", name: "DPT_Char_8859_1" },
{ id: "DPST-5-001", name: "DPT_Scaling" },
{ id: "DPST-5-003", name: "DPT_Angle" },
{ id: "DPST-5-004", name: "DPT_Percent_U8" },
{ id: "DPST-5-005", name: "DPT_DecimalFactor" },
{ id: "DPST-5-006", name: "DPT_Tariff" },
{ id: "DPST-5-010", name: "DPT_Value_1_Ucount" },
{ id: "DPST-6-001", name: "DPT_Percent_V8" },
{ id: "DPST-6-010", name: "DPT_Value_1_Count" },
{ id: "DPST-6-020", name: "DPT_Status_Mode3" },
{ id: "DPST-7-001", name: "DPT_Value_2_Ucount" },
{ id: "DPST-7-002", name: "DPT_TimePeriodMsec" },
{ id: "DPST-7-003", name: "DPT_TimePeriod10Msec" },
{ id: "DPST-7-004", name: "DPT_TimePeriod100Msec" },
{ id: "DPST-7-005", name: "DPT_TimePeriodSec" },
{ id: "DPST-7-006", name: "DPT_TimePeriodMin" },
{ id: "DPST-7-007", name: "DPT_TimePeriodHrs" },
{ id: "DPST-7-010", name: "DPT_PropDataType" },
{ id: "DPST-7-011", name: "DPT_Length_mm" },
{ id: "DPST-7-012", name: "DPT_UElCurrentmA" },
{ id: "DPST-7-013", name: "DPT_Brightness" },
{ id: "DPST-8-001", name: "DPT_Value_2_Count" },
{ id: "DPST-8-002", name: "DPT_DeltaTimeMsec" },
{ id: "DPST-8-003", name: "DPT_DeltaTime10Msec" },
{ id: "DPST-8-004", name: "DPT_DeltaTime100Msec" },
{ id: "DPST-8-005", name: "DPT_DeltaTimeSec" },
{ id: "DPST-8-006", name: "DPT_DeltaTimeMin" },
{ id: "DPST-8-007", name: "DPT_DeltaTimeHrs" },
{ id: "DPST-8-010", name: "DPT_Percent_V16" },
{ id: "DPST-8-011", name: "DPT_Rotation_Angle" },
{ id: "DPST-9-001", name: "DPT_Value_Temp" },
{ id: "DPST-9-002", name: "DPT_Value_Tempd" },
{ id: "DPST-9-003", name: "DPT_Value_Tempa" },
{ id: "DPST-9-004", name: "DPT_Value_Lux" },
{ id: "DPST-9-005", name: "DPT_Value_Wsp" },
{ id: "DPST-9-006", name: "DPT_Value_Pres" },
{ id: "DPST-9-007", name: "DPT_Value_Humidity" },
{ id: "DPST-9-008", name: "DPT_Value_AirQuality" },
{ id: "DPST-9-010", name: "DPT_Value_Time1" },
{ id: "DPST-9-011", name: "DPT_Value_Time2" },
{ id: "DPST-9-020", name: "DPT_Value_Volt" },
{ id: "DPST-9-021", name: "DPT_Value_Curr" },
{ id: "DPST-9-022", name: "DPT_PowerDensity" },
{ id: "DPST-9-023", name: "DPT_KelvinPerPercent" },
{ id: "DPST-9-024", name: "DPT_Power" },
{ id: "DPST-9-025", name: "DPT_Value_Volume_Flow" },
{ id: "DPST-9-026", name: "DPT_Rain_Amount" },
{ id: "DPST-9-027", name: "DPT_Value_Temp_F" },
{ id: "DPST-9-028", name: "DPT_Value_Wsp_kmh" },
{ id: "DPST-10-001", name: "DPT_TimeOfDay" },
{ id: "DPST-11-001", name: "DPT_Date" },
{ id: "DPST-12-001", name: "DPT_Value_4_Ucount" },
{ id: "DPST-13-001", name: "DPT_Value_4_Count" },
{ id: "DPST-13-002", name: "DPT_FlowRate_m3/h" },
{ id: "DPST-13-010", name: "DPT_ActiveEnergy" },
{ id: "DPST-13-012", name: "DPT_ReactiveEnergy" },
{ id: "DPST-13-013", name: "DPT_ActiveEnergy_kWh" },
{ id: "DPST-13-014", name: "DPT_ApparantEnergy_kVAh" },
{ id: "DPST-13-015", name: "DPT_ReactiveEnergy_kVARh" },
{ id: "DPST-13-100", name: "DPT_LongDeltaTimeSec" },
{ id: "DPST-14-000", name: "DPT_Value_Acceleration" },
{ id: "DPST-14-001", name: "DPT_Value_Acceleration_Angular" },
{ id: "DPST-14-002", name: "DPT_Value_Activation_Energy" },
{ id: "DPST-14-003", name: "DPT_Value_Activity" },
{ id: "DPST-14-004", name: "DPT_Value_Mol" },
{ id: "DPST-14-005", name: "DPT_Value_Amplitude" },
{ id: "DPST-14-006", name: "DPT_Value_AngleRad" },
{ id: "DPST-14-007", name: "DPT_Value_AngleDeg" },
{ id: "DPST-14-008", name: "DPT_Value_Angular_Momentum" },
{ id: "DPST-14-009", name: "DPT_Value_Angular_Velocity" },
{ id: "DPST-14-010", name: "DPT_Value_Area" },
{ id: "DPST-14-011", name: "DPT_Value_Capacitance" },
{ id: "DPST-14-012", name: "DPT_Value_Charge_DensitySurface" },
{ id: "DPST-14-013", name: "DPT_Value_Charge_DensityVolume" },
{ id: "DPST-14-014", name: "DPT_Value_Compressibility" },
{ id: "DPST-14-015", name: "DPT_Value_Conductance" },
{ id: "DPST-14-016", name: "DPT_Value_Electrical_Conductivity" },
{ id: "DPST-14-017", name: "DPT_Value_Density" },
{ id: "DPST-14-018", name: "DPT_Value_Electric_Charge" },
{ id: "DPST-14-019", name: "DPT_Value_Electric_Current" },
{ id: "DPST-14-020", name: "DPT_Value_Electric_CurrentDensity" },
{ id: "DPST-14-021", name: "DPT_Value_Electric_DipoleMoment" },
{ id: "DPST-14-022", name: "DPT_Value_Electric_Displacement" },
{ id: "DPST-14-023", name: "DPT_Value_Electric_FieldStrength" },
{ id: "DPST-14-024", name: "DPT_Value_Electric_Flux" },
{ id: "DPST-14-025", name: "DPT_Value_Electric_FluxDensity" },
{ id: "DPST-14-026", name: "DPT_Value_Electric_Polarization" },
{ id: "DPST-14-027", name: "DPT_Value_Electric_Potential" },
{ id: "DPST-14-028", name: "DPT_Value_Electric_PotentialDifference" },
{ id: "DPST-14-029", name: "DPT_Value_ElectromagneticMoment" },
{ id: "DPST-14-030", name: "DPT_Value_Electromotive_Force" },
{ id: "DPST-14-031", name: "DPT_Value_Energy" },
{ id: "DPST-14-032", name: "DPT_Value_Force" },
{ id: "DPST-14-033", name: "DPT_Value_Frequency" },
{ id: "DPST-14-034", name: "DPT_Value_Angular_Frequency" },
{ id: "DPST-14-035", name: "DPT_Value_Heat_Capacity" },
{ id: "DPST-14-036", name: "DPT_Value_Heat_FlowRate" },
{ id: "DPST-14-037", name: "DPT_Value_Heat_Quantity" },
{ id: "DPST-14-038", name: "DPT_Value_Impedance" },
{ id: "DPST-14-039", name: "DPT_Value_Length" },
{ id: "DPST-14-040", name: "DPT_Value_Light_Quantity" },
{ id: "DPST-14-041", name: "DPT_Value_Luminance" },
{ id: "DPST-14-042", name: "DPT_Value_Luminous_Flux" },
{ id: "DPST-14-043", name: "DPT_Value_Luminous_Intensity" },
{ id: "DPST-14-044", name: "DPT_Value_Magnetic_FieldStrength" },
{ id: "DPST-14-045", name: "DPT_Value_Magnetic_Flux" },
{ id: "DPST-14-046", name: "DPT_Value_Magnetic_FluxDensity" },
{ id: "DPST-14-047", name: "DPT_Value_Magnetic_Moment" },
{ id: "DPST-14-048", name: "DPT_Value_Magnetic_Polarization" },
{ id: "DPST-14-049", name: "DPT_Value_Magnetization" },
{ id: "DPST-14-050", name: "DPT_Value_MagnetomotiveForce" },
{ id: "DPST-14-051", name: "DPT_Value_Mass" },
{ id: "DPST-14-052", name: "DPT_Value_MassFlux" },
{ id: "DPST-14-053", name: "DPT_Value_Momentum" },
{ id: "DPST-14-054", name: "DPT_Value_Phase_AngleRad" },
{ id: "DPST-14-055", name: "DPT_Value_Phase_AngleDeg" },
{ id: "DPST-14-056", name: "DPT_Value_Power" },
{ id: "DPST-14-057", name: "DPT_Value_Power_Factor" },
{ id: "DPST-14-058", name: "DPT_Value_Pressure" },
{ id: "DPST-14-059", name: "DPT_Value_Reactance" },
{ id: "DPST-14-060", name: "DPT_Value_Resistance" },
{ id: "DPST-14-061", name: "DPT_Value_Resistivity" },
{ id: "DPST-14-062", name: "DPT_Value_SelfInductance" },
{ id: "DPST-14-063", name: "DPT_Value_SolidAngle" },
{ id: "DPST-14-064", name: "DPT_Value_Sound_Intensity" },
{ id: "DPST-14-065", name: "DPT_Value_Speed" },
{ id: "DPST-14-066", name: "DPT_Value_Stress" },
{ id: "DPST-14-067", name: "DPT_Value_Surface_Tension" },
{ id: "DPST-14-068", name: "DPT_Value_Common_Temperature" },
{ id: "DPST-14-069", name: "DPT_Value_Absolute_Temperature" },
{ id: "DPST-14-070", name: "DPT_Value_TemperatureDifference" },
{ id: "DPST-14-071", name: "DPT_Value_Thermal_Capacity" },
{ id: "DPST-14-072", name: "DPT_Value_Thermal_Conductivity" },
{ id: "DPST-14-073", name: "DPT_Value_ThermoelectricPower" },
{ id: "DPST-14-074", name: "DPT_Value_Time" },
{ id: "DPST-14-075", name: "DPT_Value_Torque" },
{ id: "DPST-14-076", name: "DPT_Value_Volume" },
{ id: "DPST-14-077", name: "DPT_Value_Volume_Flux" },
{ id: "DPST-14-078", name: "DPT_Value_Weight" },
{ id: "DPST-14-079", name: "DPT_Value_Work" },
{ id: "DPST-15-000", name: "DPT_Access_Data" },
{ id: "DPST-17-001", name: "DPT_SceneNumber" },
{ id: "DPST-18-001", name: "DPT_SceneControl" },
{ id: "DPST-19-001", name: "DPT_DateTime" },
{ id: "DPST-20-001", name: "DPT_SCLOMode" },
{ id: "DPST-20-002", name: "DPT_BuildingMode" },
{ id: "DPST-20-003", name: "DPT_OccMode" },
{ id: "DPST-20-004", name: "DPT_Priority" },
{ id: "DPST-20-005", name: "DPT_LightApplicationMode" },
{ id: "DPST-20-006", name: "DPT_ApplicationArea" },
{ id: "DPST-20-007", name: "DPT_AlarmClassType" },
{ id: "DPST-20-008", name: "DPT_PSUMode" },
{ id: "DPST-20-011", name: "DPT_ErrorClass_System" },
{ id: "DPST-20-012", name: "DPT_ErrorClass_HVAC" },
{ id: "DPST-20-013", name: "DPT_Time_Delay" },
{ id: "DPST-20-014", name: "DPT_Beaufort_Wind_Force_Scale" },
{ id: "DPST-20-017", name: "DPT_SensorSelect" },
{ id: "DPST-20-020", name: "DPT_ActuatorConnectType" },
{ id: "DPST-20-100", name: "DPT_FuelType" },
{ id: "DPST-20-101", name: "DPT_BurnerType" },
{ id: "DPST-20-102", name: "DPT_HVACMode" },
{ id: "DPST-20-103", name: "DPT_DHWMode" },
{ id: "DPST-20-104", name: "DPT_LoadPriority" },
{ id: "DPST-20-105", name: "DPT_HVACContrMode" },
{ id: "DPST-20-106", name: "DPT_HVACEmergMode" },
{ id: "DPST-20-107", name: "DPT_ChangeoverMode" },
{ id: "DPST-20-108", name: "DPT_ValveMode" },
{ id: "DPST-20-109", name: "DPT_DamperMode" },
{ id: "DPST-20-110", name: "DPT_HeaterMode" },
{ id: "DPST-20-111", name: "DPT_FanMode" },
{ id: "DPST-20-112", name: "DPT_MasterSlaveMode" },
{ id: "DPST-20-113", name: "DPT_StatusRoomSetp" },
{ id: "DPST-20-120", name: "DPT_ADAType" },
{ id: "DPST-20-121", name: "DPT_BackupMode" },
{ id: "DPST-20-122", name: "DPT_StartSynchronization" },
{ id: "DPST-20-600", name: "DPT_Behaviour_Lock_Unlock" },
{ id: "DPST-20-601", name: "DPT_Behaviour_Bus_Power_Up_Down" },
{ id: "DPST-20-602", name: "DPT_DALI_Fade_Time" },
{ id: "DPST-20-603", name: "DPT_BlinkingMode" },
{ id: "DPST-20-604", name: "DPT_LightControlMode" },
{ id: "DPST-20-605", name: "DPT_SwitchPBModel" },
{ id: "DPST-20-606", name: "DPT_PBAction" },
{ id: "DPST-20-607", name: "DPT_DimmPBModel" },
{ id: "DPST-20-608", name: "DPT_SwitchOnMode" },
{ id: "DPST-20-609", name: "DPT_LoadTypeSet" },
{ id: "DPST-20-610", name: "DPT_LoadTypeDetected" },
{ id: "DPST-20-801", name: "1 DPT_SABExceptBehaviour" },
{ id: "DPST-20-802", name: "DPT_SABBehaviour_Lock_Unlock" },
{ id: "DPST-20-803", name: "DPT_SSSBMode" },
{ id: "DPST-20-804", name: "DPT_BlindsControlMode" },
{ id: "DPST-20-1000", name: "DPT_CommMode" },
{ id: "DPST-20-1001", name: "DPT_AddInfoTypes" },
{ id: "DPST-20-1002", name: "DPT_RF_ModeSelect" },
{ id: "DPST-20-1003", name: "DPT_RF_FilterSelect" },
{ id: "DPST-21-001", name: "DPT_StatusGen" },
{ id: "DPST-21-002", name: "DPT_Device_Control" },
{ id: "DPST-21-100", name: "DPT_ForceSign" },
{ id: "DPST-21-101", name: "DPT_ForceSignCool" },
{ id: "DPST-21-102", name: "DPT_StatusRHC" },
{ id: "DPST-21-103", name: "DPT_StatusSDHWC" },
{ id: "DPST-21-104", name: "DPT_FuelTypeSet" },
{ id: "DPST-21-105", name: "DPT_StatusRCC" },
{ id: "DPST-21-106", name: "DPT_StatusAHU" },
{ id: "DPST-21-601", name: "DPT_LightActuatorErrorInfo" },
{ id: "DPST-21-1000", name: "DPT_RF_ModeInfo" },
{ id: "DPST-21-1001", name: "DPT_RF_FilterInfo" },
{ id: "DPST-21-1010", name: "DPT_Channel_Activation_8" },
{ id: "DPST-22-100", name: "DPT_StatusDHWC" },
{ id: "DPST-22-101", name: "DPT_StatusRHCC" },
{ id: "DPST-22-1000", name: "DPT_Media" },
{ id: "DPST-22-1010", name: "DPT_Channel_Activation_16" },
{ id: "DPST-23-001", name: "DPT_OnOffAction" },
{ id: "DPST-23-002", name: "DPT_Alarm_Reaction" },
{ id: "DPST-23-003", name: "DPT_UpDown_Action" },
{ id: "DPST-23-102", name: "DPT_HVAC_PB_Action" },
{ id: "DPST-25-1000", name: "DPT_DoubleNibble" },
{ id: "DPST-26-001", name: "SceneInfo" },
{ id: "DPST-27-001", name: "CombinedInfoOnOff" },
{ id: "DPST-29-010", name: "ActiveEnergy_V64" },
{ id: "DPST-29-011", name: "ApparantEnergy_V64" },
{ id: "DPST-29-012", name: "ReactiveEnergy_V64" },
{ id: "DPST-30-1010", name: "Channel_Activation_24" },
{ id: "DPST-31-101", name: "PB_Action_HVAC_Extended" },
{ id: "DPST-200-100", name: "Heat/Cool_Z" },
{ id: "DPST-200-101", name: "BinaryValue_Z" },
{ id: "DPST-201-100", name: "HVACMode_Z" },
{ id: "DPST-201-102", name: "DHWMode_Z" },
{ id: "DPST-201-104", name: "HVACContrMode_Z" },
{ id: "DPST-201-105", name: "EnableH/Cstage_Z" },
{ id: "DPST-201-107", name: "BuildingMode_Z" },
{ id: "DPST-201-108", name: "OccMode_Z" },
{ id: "DPST-201-109", name: "HVACEmergMode_Z" },
{ id: "DPST-202-001", name: "RelValue_Z" },
{ id: "DPST-202-002", name: "UCountValue8_Z" },
{ id: "DPST-203-002", name: "TimePeriodMsec_Z" },
{ id: "DPST-203-003", name: "TimePeriod10Msec_Z" },
{ id: "DPST-203-004", name: "TimePeriod100Msec_Z" },
{ id: "DPST-203-005", name: "TimePeriodSec_Z" },
{ id: "DPST-203-006", name: "TimePeriodMin_Z" },
{ id: "DPST-203-007", name: "TimePeriodHrs_Z" },
{ id: "DPST-203-011", name: "UFlowRateLiter/h_Z" },
{ id: "DPST-203-012", name: "UCountValue16_Z" },
{ id: "DPST-203-013", name: "UElCurrentμA_Z" },
{ id: "DPST-203-014", name: "PowerKW_Z" },
{ id: "DPST-203-015", name: "AtmPressureAbs_Z" },
{ id: "DPST-203-017", name: "PercentU16_Z" },
{ id: "DPST-203-100", name: "HVACAirQual_Z" },
{ id: "DPST-203-101", name: "WindSpeed_Z" },
{ id: "DPST-203-102", name: "SunIntensity_Z" },
{ id: "DPST-203-104", name: "HVACAirFlowAbs_Z" },
{ id: "DPST-204-001", name: "RelSignedValue_Z" },
{ id: "DPST-205-002", name: "DeltaTimeMsec_Z" },
{ id: "DPST-205-003", name: "DeltaTime10Msec_Z" },
{ id: "DPST-205-004", name: "DeltaTime100Msec_Z" },
{ id: "DPST-205-005", name: "DeltaTimeSec_Z" },
{ id: "DPST-205-006", name: "DeltaTimeMin_Z" },
{ id: "DPST-205-007", name: "DeltaTimeHrs_Z" },
{ id: "DPST-205-017", name: "Percent_V16_Z" },
{ id: "DPST-205-100", name: "TempHVACAbs_Z" },
{ id: "DPST-205-101", name: "TempHVACRel_Z" },
{ id: "DPST-205-102", name: "HVACAirFlowRel_Z" },
{ id: "DPST-206-100", name: "HVACModeNext" },
{ id: "DPST-206-102", name: "DHWModeNext" },
{ id: "DPST-206-104", name: "OccModeNext" },
{ id: "DPST-206-105", name: "BuildingModeNext" },
{ id: "DPST-207-100", name: "StatusBUC" },
{ id: "DPST-207-101", name: "LockSign" },
{ id: "DPST-207-102", name: "ValueDemBOC" },
{ id: "DPST-207-104", name: "ActPosDemAbs" },
{ id: "DPST-207-105", name: "StatusAct" },
{ id: "DPST-207-600", name: "StatusLightingActuator" },
{ id: "DPST-209-100", name: "StatusHPM" },
{ id: "DPST-209-101", name: "TempRoomDemAbs" },
{ id: "DPST-209-102", name: "StatusCPM" },
{ id: "DPST-209-103", name: "StatusWTC" },
{ id: "DPST-210-100", name: "TempFlowWaterDemAbs" },
{ id: "DPST-211-100", name: "EnergyDemWater" },
{ id: "DPST-212-100", name: "TempRoomSetpSetShift[3]" },
{ id: "DPST-212-101", name: "TempRoomSetpSet[3]" },
{ id: "DPST-213-100", name: "TempRoomSetpSet[4]" },
{ id: "DPST-213-101", name: "TempDHWSetpSet[4]" },
{ id: "DPST-213-102", name: "TempRoomSetpSetShift[4]" },
{ id: "DPST-214-100", name: "PowerFlowWaterDemHPM" },
{ id: "DPST-214-101", name: "PowerFlowWaterDemCPM" },
{ id: "DPST-215-100", name: "StatusBOC" },
{ id: "DPST-215-101", name: "StatusCC" },
{ id: "DPST-216-100", name: "SpecHeatProd" },
{ id: "DPST-217-001", name: "Version" },
{ id: "DPST-218-001", name: "VolumeLiter_Z" },
{ id: "DPST-218-002", name: "FlowRate_m3/h_Z" },
{ id: "DPST-219-001", name: "AlarmInfo" },
{ id: "DPST-220-100", name: "TempHVACAbsNext" },
{ id: "DPST-221-001", name: "SerNum" },
{ id: "DPST-222-100", name: "TempRoomSetpSetF16[3]" },
{ id: "DPST-222-101", name: "TempRoomSetpSetShiftF16[3]" },
{ id: "DPST-223-100", name: "EnergyDemAir" },
{ id: "DPST-224-100", name: "TempSupplyAirSetpSet" },
{ id: "DPST-225-001", name: "ScalingSpeed" },
{ id: "DPST-225-002", name: "Scaling_Step_Time" },
{ id: "DPST-225-003", name: "TariffNext" },
{ id: "DPST-229-001", name: "MeteringValue" },
{ id: "DPST-230-1000", name: "MBus_Address" },
{ id: "DPST-231-001", name: "Locale_ASCII" },
{ id: "DPST-232-600", name: "Colour_RGB" },
{ id: "DPST-234-001", name: "LanguageCodeAlpha2" },
{ id: "DPST-234-002", name: "RegionCodeAlpha2" },
{ id: "DPST-235-001", name: "Tariff_ActiveEnergy" },
{ id: "DPST-236-001", name: "Prioritised_Mode_Control" },
{ id: "DPST-237-600", name: "DALI_Control_Gear_Diagnostic" },
{ id: "DPST-238-001", name: "SceneConfig" },
{ id: "DPST-238-600", name: "DALI_Diagnostic" },
{ id: "DPST-239-001", name: "FlaggedScaling" },
{ id: "DPST-240-800", name: "CombinedPosition" },
{ id: "DPST-241-800", name: "StatusSAB" },
];


function initializeDataPointDropdown() {
    const dataPointSelect = document.getElementById('dataPoint');
    dataPointTypes.forEach(dp => {
        const option = document.createElement('option');
        option.value = dp.id;
        option.textContent = `${dp.id} - ${dp.name}`;
        dataPointSelect.appendChild(option);
    });
}
initializeDataPointDropdown();

function addGroup() {
    const mainGroupName = document.getElementById('mainGroupName').value.trim();
    const mainGroupIndex = parseInt(document.getElementById('mainGroupIndex').value.trim());
    const middleGroupName = document.getElementById('middleGroupName').value.trim();
    const middleGroupIndex = parseInt(document.getElementById('middleGroupIndex').value.trim());
    const subGroupName = document.getElementById('subGroupName').value.trim();
    const subGroupIndex = parseInt(document.getElementById('subGroupIndex').value.trim());
    const dataPointType = document.getElementById('dataPoint').value;

    if (!mainGroupName || isNaN(mainGroupIndex) || !middleGroupName || isNaN(middleGroupIndex)) {
        alert('Main Group and Middle Group names and indices are required.');
        return;
    }

    if ((mainGroupIndex < 1 || mainGroupIndex > 32) ||
        (middleGroupIndex < 1 || middleGroupIndex > 8) ||
        (subGroupIndex && (subGroupIndex < 1 || subGroupIndex > 255))) {
        alert('Please provide valid indices: Main (1-32), Middle (1-8), Subgroup (1-255).');
        return;
    }

    if (editMode) {
        updateGroup(mainGroupName, mainGroupIndex, middleGroupName, middleGroupIndex, subGroupName, subGroupIndex, dataPointType);
        return;
    }

    let mainGroup = groupData.find(group => group.index === mainGroupIndex);
    if (!mainGroup) {
        mainGroup = {
            name: mainGroupName,
            index: mainGroupIndex,
            middleGroups: []
        };
        groupData.push(mainGroup);
    }

    let middleGroup = mainGroup.middleGroups.find(group => group.index === middleGroupIndex);
    if (!middleGroup) {
        middleGroup = {
            name: middleGroupName,
            index: middleGroupIndex,
            subGroups: []
        };
        mainGroup.middleGroups.push(middleGroup);
    }

    if (subGroupName && subGroupIndex) {
        middleGroup.subGroups.push({
            name: subGroupName,
            index: subGroupIndex,
            dataPoint: dataPointType
        });
    }

    updateTable();
    clearForm();
}

function updateGroup(mainGroupName, mainGroupIndex, middleGroupName, middleGroupIndex, subGroupName, subGroupIndex, dataPointType) {
    const { mainIndex, middleIndex, subIndex } = editMode;

    const mainGroup = groupData.find(group => group.index === mainIndex);
    const middleGroup = mainGroup.middleGroups.find(group => group.index === middleIndex);

    if (subIndex) {
        middleGroup.subGroups = middleGroup.subGroups.filter(group => group.index !== subIndex);
    }

    if (middleGroup.subGroups.length === 0 && middleGroupIndex !== middleIndex) {
        mainGroup.middleGroups = mainGroup.middleGroups.filter(group => group.index !== middleIndex);
    }

    if (mainGroup.middleGroups.length === 0 && mainGroupIndex !== mainIndex) {
        groupData.splice(groupData.indexOf(mainGroup), 1);
    }

    editMode = null;
    addGroup();
}

function editGroup(mainIndex, middleIndex, subIndex) {
    const mainGroup = groupData.find(group => group.index === mainIndex);
    const middleGroup = mainGroup.middleGroups.find(group => group.index === middleIndex);
    const subGroup = subIndex ? middleGroup.subGroups.find(group => group.index === subIndex) : null;

    document.getElementById('mainGroupName').value = mainGroup.name;
    document.getElementById('mainGroupIndex').value = mainGroup.index;
    document.getElementById('middleGroupName').value = middleGroup.name;
    document.getElementById('middleGroupIndex').value = middleGroup.index;
    document.getElementById('subGroupName').value = subGroup ? subGroup.name : '';
    document.getElementById('subGroupIndex').value = subGroup ? subGroup.index : '';
    document.getElementById('dataPoint').value = subGroup ? subGroup.dataPoint : '';

    editMode = { mainIndex, middleIndex, subIndex };
}

function deleteGroup(mainIndex, middleIndex, subIndex) {
    const mainGroup = groupData.find(group => group.index === mainIndex);
    const middleGroup = mainGroup.middleGroups.find(group => group.index === middleIndex);

    if (subIndex) {
        middleGroup.subGroups = middleGroup.subGroups.filter(group => group.index !== subIndex);
        if (middleGroup.subGroups.length === 0) {
            mainGroup.middleGroups = mainGroup.middleGroups.filter(group => group.index !== middleIndex);
        }
        if (mainGroup.middleGroups.length === 0) {
            groupData.splice(groupData.indexOf(mainGroup), 1);
        }
    } else {
        mainGroup.middleGroups = mainGroup.middleGroups.filter(group => group.index !== middleIndex);
        if (mainGroup.middleGroups.length === 0) {
            groupData.splice(groupData.indexOf(mainGroup), 1);
        }
    }

    updateTable();
}

function updateTable() {
    const tableBody = document.getElementById('groupTable');
    tableBody.innerHTML = '';

    groupData.forEach(mainGroup => {
        mainGroup.middleGroups.forEach(middleGroup => {
            middleGroup.subGroups.forEach(subGroup => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${mainGroup.name} (${mainGroup.index})</td>
                    <td>${middleGroup.name} (${middleGroup.index})</td>
                    <td>${subGroup.name || ''} (${subGroup.index || ''}) - ${subGroup.dataPoint || ''}</td>
                    <td>
                        <button onclick="editGroup(${mainGroup.index}, ${middleGroup.index}, ${subGroup.index})">Edit</button>
                        <button onclick="deleteGroup(${mainGroup.index}, ${middleGroup.index}, ${subGroup.index})">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            if (middleGroup.subGroups.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${mainGroup.name} (${mainGroup.index})</td>
                    <td>${middleGroup.name} (${middleGroup.index})</td>
                    <td>No Subgroups</td>
                    <td>
                        <button onclick="editGroup(${mainGroup.index}, ${middleGroup.index})">Edit</button>
                        <button onclick="deleteGroup(${mainGroup.index}, ${middleGroup.index})">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            }
        });
    });
}

function clearForm() {
    document.getElementById('mainGroupName').value = '';
    document.getElementById('mainGroupIndex').value = '';
    document.getElementById('middleGroupName').value = '';
    document.getElementById('middleGroupIndex').value = '';
    document.getElementById('subGroupName').value = '';
    document.getElementById('subGroupIndex').value = '';
    document.getElementById('dataPoint').selectedIndex = 0;
    editMode = null;
}

function importFromXML() {
    const fileInput = document.getElementById('importXML');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select an XML file to import.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(e.target.result, "text/xml");

        const groupRanges = xmlDoc.getElementsByTagName('GroupRange');
        groupData.length = 0;

        for (let i = 0; i < groupRanges.length; i++) {
            const mainRange = groupRanges[i];

            if (mainRange.parentElement.tagName === 'GroupRange') continue;

            const mainGroupName = mainRange.getAttribute('Name');
            const mainGroupIndex = Math.floor(parseInt(mainRange.getAttribute('RangeStart')) / 2048) + 1;

            const middleGroups = mainRange.getElementsByTagName('GroupRange');
            const mainGroup = {
                name: mainGroupName,
                index: mainGroupIndex,
                middleGroups: []
            };

            for (let j = 0; j < middleGroups.length; j++) {
                const middleRange = middleGroups[j];

                if (middleRange.parentElement !== mainRange) continue;

                const middleGroupName = middleRange.getAttribute('Name');
                const middleGroupIndex = Math.floor((parseInt(middleRange.getAttribute('RangeStart')) % 2048) / 256) + 1;

                const subGroups = middleRange.getElementsByTagName('GroupAddress');
                const middleGroup = {
                    name: middleGroupName,
                    index: middleGroupIndex,
                    subGroups: []
                };

                for (let k = 0; k < subGroups.length; k++) {
                    const subGroup = subGroups[k];

                    const subGroupName = subGroup.getAttribute('Name');
                    const addressParts = subGroup.getAttribute('Address').split('/');
                    const subGroupIndex = parseInt(addressParts[2]);
                    const dataPoint = subGroup.getAttribute('DPTs');

                    middleGroup.subGroups.push({
                        name: subGroupName,
                        index: subGroupIndex,
                        dataPoint: dataPoint || ''
                    });
                }

                mainGroup.middleGroups.push(middleGroup);
            }

            groupData.push(mainGroup);
        }

        updateTable();
        alert('XML imported successfully!');
    };

    reader.readAsText(file);
}

function exportToXML() {
    let xml = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>\n`;
    xml += `<GroupAddress-Export xmlns="http://knx.org/xml/ga-export/01">\n`;

    groupData.forEach(mainGroup => {
        const mainRangeStart = (mainGroup.index - 1) * 2048;
        const mainRangeEnd = mainRangeStart + 2047;

        xml += `  <GroupRange Name="${mainGroup.name}" RangeStart="${mainRangeStart}" RangeEnd="${mainRangeEnd}">\n`;

        mainGroup.middleGroups.forEach(middleGroup => {
            const middleRangeStart = mainRangeStart + (middleGroup.index - 1) * 256;
            const middleRangeEnd = middleRangeStart + 255;

            xml += `    <GroupRange Name="${middleGroup.name}" RangeStart="${middleRangeStart}" RangeEnd="${middleRangeEnd}">\n`;

            middleGroup.subGroups.forEach(subGroup => {
                const address = `${mainGroup.index - 1}/${middleGroup.index - 1}/${subGroup.index}`;
                xml += `      <GroupAddress Name="${subGroup.name}" Address="${address}" DPTs="${subGroup.dataPoint}" />\n`;
            });

            xml += `    </GroupRange>\n`;
        });

        xml += `  </GroupRange>\n`;
    });

    xml += `</GroupAddress-Export>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'group_addresses.xml';
    a.click();

    URL.revokeObjectURL(url);
}