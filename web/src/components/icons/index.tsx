import type { SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement> & {
  size?: number
  title?: string
}

function Icon({ size = 20, title, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

/**
 * Material Symbols glyphs use a 960-unit viewBox with a negative origin, so
 * they bypass the 24px `Icon` frame and pass the viewBox through instead.
 */
function MaterialIcon({ size = 20, title, children, ...props }: IconProps) {
  return (
    <Icon viewBox="0 -960 960 960" size={size} title={title} {...props}>
      {children}
    </Icon>
  )
}

export function LockIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M220-80q-24.75 0-42.37-17.63Q160-115.25 160-140v-434q0-24.75 17.63-42.38Q195.25-634 220-634h70v-96q0-78.85 55.61-134.42Q401.21-920 480.11-920q78.89 0 134.39 55.58Q670-808.85 670-730v96h70q24.75 0 42.38 17.62Q800-598.75 800-574v434q0 24.75-17.62 42.37Q764.75-80 740-80H220Zm0-60h520v-434H220v434Zm314.5-162.03Q557-324.06 557-355q0-30-22.67-54.5t-54.5-24.5q-31.83 0-54.33 24.5t-22.5 55q0 30.5 22.67 52.5t54.5 22q31.83 0 54.33-22.03ZM350-634h260v-96q0-54.17-37.88-92.08-37.88-37.92-92-37.92T388-822.08q-38 37.91-38 92.08v96ZM220-140v-434 434Z" />
    </MaterialIcon>
  )
}

export function VisibilityIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M600.5-379.5Q650-429 650-500t-49.5-120.5Q551-670 480-670t-120.5 49.5Q310-571 310-500t49.5 120.5Q409-330 480-330t120.5-49.5Zm-200-41Q368-453 368-500t32.5-79.5Q433-612 480-612t79.5 32.5Q592-547 592-500t-32.5 79.5Q527-388 480-388t-79.5-32.5ZM216-283Q98-366 40-500q58-134 176-217t264-83q146 0 264 83t176 217q-58 134-176 217t-264 83q-146 0-264-83Zm264-217Zm222.5 174.5Q804-391 857-500q-53-109-154.5-174.5T480-740q-121 0-222.5 65.5T102-500q54 109 155.5 174.5T480-260q121 0 222.5-65.5Z" />
    </MaterialIcon>
  )
}

export function VisibilityOffIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="m629-419-44-44q26-71-27-118t-115-24l-44-44q17-11 38-16t43-5q71 0 120.5 49.5T650-500q0 22-5.5 43.5T629-419Zm129 129-40-40q49-36 85.5-80.5T857-500q-50-111-150-175.5T490-740q-42 0-86 8t-69 19l-46-47q35-16 89.5-28T485-800q143 0 261.5 81.5T920-500q-26 64-67 117t-95 93Zm58 226L648-229q-35 14-79 21.5t-89 7.5q-146 0-265-81.5T40-500q20-52 55.5-101.5T182-696L56-822l42-43 757 757-39 44ZM223-654q-37 27-71.5 71T102-500q51 111 153.5 175.5T488-260q33 0 65-4t48-12l-64-64q-11 5-27 7.5t-30 2.5q-70 0-120-49t-50-121q0-15 2.5-30t7.5-27l-97-97Zm305 142Zm-116 58Z" />
    </MaterialIcon>
  )
}

export function ArrowForwardIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M686-450H160v-60h526L438-758l42-42 320 320-320 320-42-42 248-248Z" />
    </MaterialIcon>
  )
}

export function ArrowBackIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="m274-450 248 248-42 42-320-320 320-320 42 42-248 248h526v60H274Z" />
    </MaterialIcon>
  )
}

export function MailIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M140-160q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h680q24 0 42 18t18 42v520q0 24-18 42t-42 18H140Zm340-302L140-685v465h680v-465L480-462Zm0-60 336-218H145l335 218ZM140-685v-55 520-465Z" />
    </MaterialIcon>
  )
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="m421-298 283-283-46-45-237 237-120-120-45 45 165 166Zm59 218q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Zm0-60q142 0 241-99.5T820-480q0-142-99-241t-241-99q-141 0-240.5 99T140-480q0 141 99.5 240.5T480-140Zm0-340Z" />
    </MaterialIcon>
  )
}

export function InfoIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M453-280h60v-240h-60v240Zm50.5-323.2q9.5-9.2 9.5-22.8 0-14.45-9.48-24.22-9.48-9.78-23.5-9.78t-23.52 9.78Q447-640.45 447-626q0 13.6 9.48 22.8 9.48 9.2 23.5 9.2t23.52-9.2ZM480.27-80q-82.74 0-155.5-31.5Q252-143 197.5-197.5t-86-127.34Q80-397.68 80-480.5t31.5-155.66Q143-709 197.5-763t127.34-85.5Q397.68-880 480.5-880t155.66 31.5Q709-817 763-763t85.5 127Q880-563 880-480.27q0 82.74-31.5 155.5Q817-252 763-197.68q-54 54.31-127 86Q563-80 480.27-80Zm.23-60Q622-140 721-239.5t99-241Q820-622 721.19-721T480-820q-141 0-240.5 98.81T140-480q0 141 99.5 240.5t241 99.5Zm-.5-340Z" />
    </MaterialIcon>
  )
}

export function AlertIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M503.5-289.48q9.5-9.48 9.5-23.5t-9.48-23.52q-9.48-9.5-23.5-9.5t-23.52 9.48q-9.5 9.48-9.5 23.5t9.48 23.52q9.48 9.5 23.5 9.5t23.52-9.48ZM453-433h60v-253h-60v253Zm27.27 353q-82.74 0-155.5-31.5Q252-143 197.5-197.5t-86-127.34Q80-397.68 80-480.5t31.5-155.66Q143-709 197.5-763t127.34-85.5Q397.68-880 480.5-880t155.66 31.5Q709-817 763-763t85.5 127Q880-563 880-480.27q0 82.74-31.5 155.5Q817-252 763-197.68q-54 54.31-127 86Q563-80 480.27-80Zm.23-60Q622-140 721-239.5t99-241Q820-622 721.19-721T480-820q-141 0-240.5 98.81T140-480q0 141 99.5 240.5t241 99.5Zm-.5-340Z" />
    </MaterialIcon>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="m249-207-42-42 231-231-231-231 42-42 231 231 231-231 42 42-231 231 231 231-42 42-231-231-231 231Z" />
    </MaterialIcon>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M796-121 533-384q-30 26-70 40.5T378-329q-108 0-183-75t-75-181q0-106 75-181t182-75q106 0 180.5 75T632-585q0 43-14 83t-42 75l264 262-44 44ZM377-389q81 0 138-57.5T572-585q0-81-57-138.5T377-781q-82 0-139.5 57.5T180-585q0 81 57.5 138.5T377-389Z" />
    </MaterialIcon>
  )
}

export function SpinnerIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M12 4a8 8 0 1 0 8 8h-2a6 6 0 1 1-6-6z"
        fillRule="evenodd"
      />
    </Icon>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M450-450H200v-60h250v-250h60v250h250v60H510v250h-60v-250Z" />
    </MaterialIcon>
  )
}

export function CopyIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M300-200q-24 0-42-18t-18-42v-560q0-24 18-42t42-18h440q24 0 42 18t18 42v560q0 24-18 42t-42 18H300Zm0-60h440v-560H300v560ZM180-80q-24 0-42-18t-18-42v-620h60v620h500v60H180Zm120-180v-560 560Z" />
    </MaterialIcon>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M378-246 154-470l43-43 181 181 384-384 43 43-427 427Z" />
    </MaterialIcon>
  )
}

export function LinkIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M450-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h170v60H280q-58.33 0-99.17 40.76-40.83 40.77-40.83 99Q140-422 180.83-381q40.84 41 99.17 41h170v60ZM325-450v-60h310v60H325Zm185 170v-60h170q58.33 0 99.17-40.76 40.83-40.77 40.83-99Q820-538 779.17-579q-40.84-41-99.17-41H510v-60h170q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H510Z" />
    </MaterialIcon>
  )
}

export function LinkOffIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="m750-291-49-49q51-10 85-48t34-89q0-58-41-99t-99-41H525v-60h155q83 0 141.5 58.5T880-477q0 62-36 112t-94 74ZM594-447l-60-60h101v60h-41ZM814-56 63-807l43-43L857-99l-43 43ZM450-280H280q-83 0-141.5-58.5T80-480q0-72 44.5-127T238-676l56 56h-14q-58 0-99 41t-41 99q0 58 41 99t99 41h170v60ZM325-450v-60h79l60 60H325Z" />
    </MaterialIcon>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M261-120q-24.75 0-42.37-17.63Q201-155.25 201-180v-570h-41v-60h188v-30h264v30h188v60h-41v570q0 24-18 42t-42 18H261Zm438-630H261v570h438v-570ZM367-266h60v-399h-60v399Zm166 0h60v-399h-60v399ZM261-750v570-570Z" />
    </MaterialIcon>
  )
}

export function DownloadIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M480-313 287-506l43-43 120 120v-371h60v371l120-120 43 43-193 193ZM220-160q-24 0-42-18t-18-42v-143h60v143h520v-143h60v143q0 24-18 42t-42 18H220Z" />
    </MaterialIcon>
  )
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M450-160v-526L202-438l-42-42 320-320 320 320-42 42-248-248v526h-60Z" />
    </MaterialIcon>
  )
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M450-800v526L202-522l-42 42 320 320 320-320-42-42-248 248v-526h-60Z" />
    </MaterialIcon>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M561-240 320-481l241-241 43 43-198 198 198 198-43 43Z" />
    </MaterialIcon>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M530-481 332-679l43-43 241 241-241 241-43-43 198-198Z" />
    </MaterialIcon>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M480-345 240-585l43-43 197 198 197-197 43 43-240 239Z" />
    </MaterialIcon>
  )
}

export function DescriptionIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M319-250h322v-60H319v60Zm0-170h322v-60H319v60ZM220-80q-24 0-42-18t-18-42v-680q0-24 18-42t42-18h361l219 219v521q0 24-18 42t-42 18H220Zm331-554v-186H220v680h520v-494H551ZM220-820v186-186 680-680Z" />
    </MaterialIcon>
  )
}

export function LogoutIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M180-120q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h299v60H180v600h299v60H180Zm486-185-43-43 102-102H360v-60h363L621-612l43-43 176 176-174 174Z" />
    </MaterialIcon>
  )
}

export function KeyIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M232-432q-20-20-20-48t20-48q20-20 48-20t48 20q20 20 20 48t-20 48q-20 20-48 20t-48-20Zm48 192q-100 0-170-70T40-480q0-100 70-170t170-70q72 0 126 34t85 103h356l113 113-167 153-88-64-88 64-75-60h-51q-25 60-78.5 98.5T280-240Zm0-60q58 0 107-38.5t63-98.5h114l54 45 88-63 82 62 85-79-51-51H450q-12-56-60-96.5T280-660q-75 0-127.5 52.5T100-480q0 75 52.5 127.5T280-300Z" />
    </MaterialIcon>
  )
}

export function UserIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M480-480q-140-35-230-162.5T160-523v-238l320-120 320 120v238q0 152-90 279.5T480-81Zm0-399Zm0-337-260 98v196q0 63 17.5 120.5T287-296q46-25 93.5-37.5T480-346q52 0 99.5 12.5T673-296q32-49 49.5-106.5T740-523v-196l-260-98Zm-78 541q-39 10-77 30 32 35 71 61.5t84 41.5q45-15 84-41.5t71-61.5q-38-20-77-30t-78-10q-39 0-78 10Z" />
    </MaterialIcon>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M576-160l-42-42 111-111-111-111 42-42 111 111 111-111 42 42-111 111 111 111-42 42-111-111-111 111Zm83-374L517-676l42-42 100 99 179-179 42 43-221 221ZM80-290v-60h360v60H80Zm0-320v-60h360v60H80Z" />
    </MaterialIcon>
  )
}

export function TrendingUpIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="m123-240-43-43 292-291 167 167 241-241H653v-60h227v227h-59v-123L538-321 371-488 123-240Z" />
    </MaterialIcon>
  )
}

export function TableChartIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M780-121H180q-24 0-42-18t-18-42v-599q0-24 18-42t42-18h600q24 0 42 18t18 42v599q0 24-18 42t-42 18ZM180-639h600v-141H180v141Zm130 60H180v398h130v-398Zm340 0v398h130v-398H650Zm-60 0H370v398h220v-398Z" />
    </MaterialIcon>
  )
}

export function DevicesIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M501-540ZM80-160v-60h421v60H80Zm100-120q-24 0-42-18t-18-42v-400q0-24 18-42t42-18h600q24 0 42 18t18 42v60h-60v-60H180v400h321v60H180Zm620 60v-400H480v-60h257q24 0 42 18t18 42v400h-57ZM380-280v-60h321v60H480Z" />
    </MaterialIcon>
  )
}

export function PendingIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M301.5-444.62q14.5-14.62 14.5-35.5 0-20.88-14.62-35.38-14.62-14.5-35.5-14.5-20.88 0-35.38 14.62-14.5 14.62-14.5 35.5 0 20.88 14.62 35.38 14.62 14.5 35.5 14.5 20.88 0 35.38-14.62Zm214 0q14.5-14.62 14.5-35.5 0-20.88-14.62-35.38-14.62-14.5-35.5-14.5-20.88 0-35.38 14.62-14.5 14.62-14.5 35.5 0 20.88 14.62 35.38 14.62 14.5 35.5 14.5 20.88 0 35.38-14.62Zm213 0q14.5-14.62 14.5-35.5 0-20.88-14.62-35.38-14.62-14.5-35.5-14.5-20.88 0-35.38 14.62-14.5 14.62-14.5 35.5 0 20.88 14.62 35.38 14.62 14.5 35.5 14.5 20.88 0 35.38-14.62ZM480.27-80q-82.74 0-155.5-31.5Q252-143 197.5-197.5t-86-127.34Q80-397.68 80-480.5t31.5-155.66Q143-709 197.5-763t127.34-85.5Q397.68-880 480.5-880t155.66 31.5Q709-817 763-763t85.5 127Q880-563 880-480.27q0 82.74-31.5 155.5Q817-252 763-197.68q-54 54.31-127 86Q563-80 480.27-80Zm.23-60Q622-140 721-239.5t99-241Q820-622 721.19-721T480-820q-141 0-240.5 98.81T140-480q0 141 99.5 240.5t241 99.5Zm-.5-340Z" />
    </MaterialIcon>
  )
}

export function ShieldPersonIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M382.5-489.5Q343-529 343-587t39.5-97.5Q422-724 480-724t97.5 39.5Q617-645 617-587t-39.5 97.5Q538-450 480-450t-97.5-39.5Zm153-42Q557-553 557-587t-21.5-55.5Q514-664 480-664t-55.5 21.5Q403-621 403-587t21.5 55.5Q446-510 480-510t55.5-21.5ZM480-81q-140-35-230-162.5T160-523v-238l320-120 320 120v238q0 152-90 279.5T480-81Zm0-399Zm0-337-260 98v196q0 63 17.5 120.5T287-296q46-25 93.5-37.5T480-346q52 0 99.5 12.5T673-296q32-49 49.5-106.5T740-523v-196l-260-98Zm-78 541q-39 10-77 30 32 35 71 61.5t84 41.5q45-15 84-41.5t71-61.5q-38-20-77-30t-78-10q-39 0-78 10Z" />
    </MaterialIcon>
  )
}

export function RuleIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="m576-160-42-42 111-111-111-111 42-42 111 111 111-111 42 42-111 111 111 111-42 42-111-111-111 111Zm83-374L517-676l42-42 100 99 179-179 42 43-221 221ZM80-290v-60h360v60H80Zm0-320v-60h360v60H80Z" />
    </MaterialIcon>
  )
}

export function LockResetIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M480-80q-88 0-164-35t-130.5-94q-54.5-59-83-138T81-513h61q-7 75 16 142.5t69.5 119Q274-200 339-169.5T480-139q142 0 241-99t99-241q0-142-99-241t-241-99q-100 0-180.5 51.5T177-633h129v60H80v-227h60v109q54-86 142.5-137.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-80-245q-14 0-24.5-10.5T365-360v-120q0-14 11.5-24.5T405-515v-45q0-31 22-53t53-22q31 0 53 22t22 53v45q17 0 28.5 10.5T595-480v120q0 14-10.5 24.5T560-325H400Zm35-190h90v-45q0-19-13-32t-32-13q-19 0-32 13t-13 32v45Z" />
    </MaterialIcon>
  )
}

export function KeyboardArrowUpIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M480-554 283-357l-43-43 240-240 240 240-43 43-197-197Z" />
    </MaterialIcon>
  )
}

export function KeyboardArrowDownIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="M480-344 240-584l43-43 197 197 197-197 43 43-240 240Z" />
    </MaterialIcon>
  )
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <MaterialIcon {...props}>
      <path d="m436-347 228-228-42-41-183 183-101-101-44 44 142 143Zm44 266q-140-35-230-162.5T160-523v-238l320-120 320 120v238q0 152-90 279.5T480-81Zm0-62q115-38 187.5-143.5T740-523v-196l-260-98-260 98v196q0 131 72.5 236.5T480-143Zm0-337Z" />
    </MaterialIcon>
  )
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 6a6 6 0 110 12 6 6 0 010-12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Icon>
  )
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Icon>
  )
}

export function MonitorIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M22 12.5H4a1 1 0 010-2h18a1 1 0 010 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12 14.5V20a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Icon>
  )
}

export function GoogleIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  )
}
