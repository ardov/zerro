/** Every icon in the app, and the only place `lucide-react` is named.
 *
 * The names are the application's, not Lucide's: a call site asks for the
 * thing it means — a delete, a category, the place money was spent — and this
 * file decides what that is drawn as. Several names share one drawing on
 * purpose, because they are different things that happen to look alike today.
 *
 * `6-shared/ui/Icons` re-exports the whole module and is what call sites
 * import from; nothing outside this directory names `lucide` directly.
 *
 * The icons ZenMoney supplies — category glyphs and bank marks — are not part
 * of this set. They arrive as data with the user's own data and are drawn by
 * `TagIcon` from `6-shared/zenmoney-assets`.
 */
import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  Calendar,
  ChartNoAxesColumn,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CirclePause,
  CircleCheck,
  CircleQuestionMark,
  CornerUpLeft,
  CornerUpRight,
  CreditCard,
  Download,
  Ellipsis,
  EllipsisVertical,
  Eye,
  Flag,
  Funnel,
  Globe,
  GripVertical,
  Heart,
  House,
  Landmark,
  LogIn,
  LogOut,
  Merge,
  MessageSquare,
  Moon,
  Plus,
  RefreshCw,
  RotateCcw,
  RotateCcwClock,
  Rewind,
  Send,
  Settings,
  Sparkles,
  SquareCheck,
  Pencil,
  Store,
  Sun,
  Tag,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from 'lucide-react'
import { createIcon } from './createIcon'

export type { TIconProps, TIconSize } from './createIcon'

// Synchronisation
export const SyncIcon = createIcon(RefreshCw, 'SyncIcon')
export const SyncDisabledIcon = createIcon(CirclePause, 'SyncDisabledIcon')
export const HistoryIcon = createIcon(RotateCcwClock, 'HistoryIcon')
export const UndoIcon = createIcon(CornerUpLeft, 'UndoIcon')
export const RedoIcon = createIcon(CornerUpRight, 'RedoIcon')
export const SaveAltIcon = createIcon(Download, 'SaveAltIcon')
export const UploadIcon = createIcon(Upload, 'UploadIcon')
export const SendIcon = createIcon(Send, 'SendIcon')

// Status
export const DoneIcon = createIcon(CircleCheck, 'DoneIcon')
export const WarningIcon = createIcon(TriangleAlert, 'WarningIcon')
export const CheckIcon = createIcon(Check, 'CheckIcon')
export const DoneAllIcon = createIcon(SquareCheck, 'DoneAllIcon')
export const VisibilityIcon = createIcon(Eye, 'VisibilityIcon')

// Editing
export const CloseIcon = createIcon(X, 'CloseIcon')
export const AddIcon = createIcon(Plus, 'AddIcon')
export const EditIcon = createIcon(Pencil, 'EditIcon')
export const DeleteIcon = createIcon(Trash2, 'DeleteIcon')
/** Puts back what was deleted. The name is the one the application already
 * used; the drawing is no longer a bin, because the counter-clockwise arrow
 * reads as "undo this" beside a `DeleteIcon` that is one. */
export const RestoreFromTrashIcon = createIcon(RotateCcw, 'RestoreFromTrashIcon')
export const MergeTypeIcon = createIcon(Merge, 'MergeTypeIcon')
export const FilterListIcon = createIcon(Funnel, 'FilterListIcon')
export const DragIndicatorIcon = createIcon(GripVertical, 'DragIndicatorIcon')
/** Opens the rest of what can be done to something. */
export const MoreVertIcon = createIcon(EllipsisVertical, 'MoreVertIcon')
export const MoreHorizIcon = createIcon(Ellipsis, 'MoreHorizIcon')

// Direction
export const ChevronRightIcon = createIcon(ChevronRight, 'ChevronRightIcon')
export const ChevronLeftIcon = createIcon(ChevronLeft, 'ChevronLeftIcon')
export const ChevronDownIcon = createIcon(ChevronDown, 'ChevronDownIcon')
export const ArrowBackIcon = createIcon(ArrowLeft, 'ArrowBackIcon')
export const ArrowForwardIcon = createIcon(ArrowRight, 'ArrowForwardIcon')
export const ArrowUpwardIcon = createIcon(ArrowUp, 'ArrowUpwardIcon')
export const ArrowDownwardIcon = createIcon(ArrowDown, 'ArrowDownwardIcon')

// Money and its parts
export const AccountBalanceIcon = createIcon(House, 'AccountBalanceIcon')
export const AccountBalanceWalletIcon = createIcon(
  CreditCard,
  'AccountBalanceWalletIcon'
)
/** One account, in a form that is editing it. */
export const AccountIcon = createIcon(Landmark, 'AccountIcon')
/** A transfer between two accounts. */
export const SyncAltIcon = createIcon(ArrowLeftRight, 'SyncAltIcon')
/** The leg money leaves an account by, and the leg it arrives on. They share
 * a drawing with `ExitToAppIcon` and each other's mirror, and mean something
 * else: a direction of money rather than a way out of the app. */
export const MoneyOutIcon = createIcon(LogOut, 'MoneyOutIcon')
export const MoneyInIcon = createIcon(LogIn, 'MoneyInIcon')
/** A category. Not to be confused with `ui/TagIcon`, which draws the icon
 * ZenMoney stores on the category itself. */
export const CategoryIcon = createIcon(Tag, 'CategoryIcon')
/** Where the money was spent. */
export const PlaceIcon = createIcon(Store, 'PlaceIcon')
export const NotesIcon = createIcon(MessageSquare, 'NotesIcon')
export const CalendarIcon = createIcon(Calendar, 'CalendarIcon')
export const EmojiFlagsIcon = createIcon(Flag, 'EmojiFlagsIcon')
export const BarChartIcon = createIcon(ChartNoAxesColumn, 'BarChartIcon')
export const WhatshotIcon = createIcon(Rewind, 'WhatshotIcon')

// Application chrome
export const SettingsIcon = createIcon(Settings, 'SettingsIcon')
export const HelpOutlineIcon = createIcon(
  CircleQuestionMark,
  'HelpOutlineIcon'
)
export const ExitToAppIcon = createIcon(LogOut, 'ExitToAppIcon')
export const FavoriteBorderIcon = createIcon(Heart, 'FavoriteBorderIcon')
export const GlobeIcon = createIcon(Globe, 'GlobeIcon')
export const WbSunnyIcon = createIcon(Sun, 'WbSunnyIcon')
export const NightsStayIcon = createIcon(Moon, 'NightsStayIcon')
export const AutoAwesomeIcon = createIcon(Sparkles, 'AutoAwesomeIcon')
