/** Feature code imports semantic names from 6-shared/ui/Icons; choose the Lucide glyph here. */
import {
  ArrowDown,
  ArrowBigDown,
  ArrowRightToLine,
  ArrowLeftFromLine,
  ArrowRightLeft,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Calendar,
  ChartNoAxesColumn,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleQuestionMark,
  Copy,
  CornerUpLeft,
  CornerUpRight,
  CreditCard,
  Banknote,
  HandCoins,
  PiggyBank,
  Wallet,
  UsersRound,
  Download,
  Ellipsis,
  EllipsisVertical,
  Eye,
  Flag,
  FolderClock,
  Funnel,
  ListFilter,
  Globe,
  GripVertical,
  Heart,
  House,
  KeyRound,
  Landmark,
  LogIn,
  LogOut,
  Mail,
  Merge,
  MessageSquare,
  Moon,
  Plus,
  RefreshCw,
  RotateCcw,
  RotateCcwClock,
  Rewind,
  Search,
  Send,
  Settings,
  Sparkles,
  SquareCheck,
  Pencil,
  Store,
  User,
  Sun,
  Tag,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from 'lucide-react'
import { createIcon } from './createIcon'

export type { TIconProps, TIconSize } from './createIcon'

export const SyncIcon = createIcon(RefreshCw, 'SyncIcon')
export const HistoryIcon = createIcon(RotateCcwClock, 'HistoryIcon')
export const UndoIcon = createIcon(CornerUpLeft, 'UndoIcon')
export const RedoIcon = createIcon(CornerUpRight, 'RedoIcon')
export const BackupFolderIcon = createIcon(FolderClock, 'BackupFolderIcon')
export const SaveAltIcon = createIcon(Download, 'SaveAltIcon')
export const UploadIcon = createIcon(Upload, 'UploadIcon')
export const SendIcon = createIcon(Send, 'SendIcon')

export const DoneIcon = createIcon(CircleCheck, 'DoneIcon')
export const WarningIcon = createIcon(TriangleAlert, 'WarningIcon')
export const CheckIcon = createIcon(Check, 'CheckIcon')
export const DoneAllIcon = createIcon(SquareCheck, 'DoneAllIcon')
export const VisibilityIcon = createIcon(Eye, 'VisibilityIcon')

export const CloseIcon = createIcon(X, 'CloseIcon')
export const SearchIcon = createIcon(Search, 'SearchIcon')
export const AddIcon = createIcon(Plus, 'AddIcon')
export const EditIcon = createIcon(Pencil, 'EditIcon')
export const CopyIcon = createIcon(Copy, 'CopyIcon')
export const DeleteIcon = createIcon(Trash2, 'DeleteIcon')
export const RestoreFromTrashIcon = createIcon(
  RotateCcw,
  'RestoreFromTrashIcon'
)
export const MergeTypeIcon = createIcon(Merge, 'MergeTypeIcon')
export const FilterListIcon = createIcon(Funnel, 'FilterListIcon')
export const AddFilterIcon = createIcon(ListFilter, 'AddFilterIcon')
export const DragIndicatorIcon = createIcon(GripVertical, 'DragIndicatorIcon')
export const MoreVertIcon = createIcon(EllipsisVertical, 'MoreVertIcon')
export const MoreHorizIcon = createIcon(Ellipsis, 'MoreHorizIcon')

export const ChevronRightIcon = createIcon(ChevronRight, 'ChevronRightIcon')
export const ChevronLeftIcon = createIcon(ChevronLeft, 'ChevronLeftIcon')
export const ChevronDownIcon = createIcon(ChevronDown, 'ChevronDownIcon')
export const ArrowBackIcon = createIcon(ArrowLeft, 'ArrowBackIcon')
export const ArrowForwardIcon = createIcon(ArrowRight, 'ArrowForwardIcon')
export const ArrowUpwardIcon = createIcon(ArrowUp, 'ArrowUpwardIcon')
export const ArrowDownwardIcon = createIcon(ArrowDown, 'ArrowDownwardIcon')

export const TransferDirectionIcon = createIcon(
  ArrowBigDown,
  'TransferDirectionIcon'
)
export const TransferIcon = createIcon(ArrowRightLeft, 'TransferIcon')
export const IncomeDebtIcon = createIcon(ArrowRightToLine, 'IncomeDebtIcon')
export const OutcomeDebtIcon = createIcon(ArrowLeftFromLine, 'OutcomeDebtIcon')

export const BudgetIcon = createIcon(PiggyBank, 'BudgetIcon')
export const EnvelopeIcon = createIcon(Mail, 'EnvelopeIcon')
export const AccountBalanceWalletIcon = createIcon(
  CreditCard,
  'AccountBalanceWalletIcon'
)
export const AccountIcon = createIcon(Landmark, 'AccountIcon')
export const CashAccountIcon = createIcon(Banknote, 'CashAccountIcon')
export const CardAccountIcon = createIcon(CreditCard, 'CardAccountIcon')
export const LoanAccountIcon = createIcon(HandCoins, 'LoanAccountIcon')
export const DepositAccountIcon = createIcon(PiggyBank, 'DepositAccountIcon')
export const EmoneyAccountIcon = createIcon(Wallet, 'EmoneyAccountIcon')
export const DebtAccountIcon = createIcon(UsersRound, 'DebtAccountIcon')
export const SyncAltIcon = createIcon(ArrowLeftRight, 'SyncAltIcon')
export const MoneyOutIcon = createIcon(LogOut, 'MoneyOutIcon')
export const MoneyInIcon = createIcon(LogIn, 'MoneyInIcon')
export const CategoryIcon = createIcon(Tag, 'CategoryIcon')
export const PlaceIcon = createIcon(Store, 'PlaceIcon')
export const PersonIcon = createIcon(User, 'PersonIcon')
export const NotesIcon = createIcon(MessageSquare, 'NotesIcon')
export const CalendarIcon = createIcon(Calendar, 'CalendarIcon')
export const EmojiFlagsIcon = createIcon(Flag, 'EmojiFlagsIcon')
export const BarChartIcon = createIcon(ChartNoAxesColumn, 'BarChartIcon')
export const WhatshotIcon = createIcon(Rewind, 'WhatshotIcon')

export const HomeIcon = createIcon(House, 'HomeIcon')
export const SettingsIcon = createIcon(Settings, 'SettingsIcon')
export const HelpOutlineIcon = createIcon(CircleQuestionMark, 'HelpOutlineIcon')
export const HowToUseIcon = createIcon(BookOpen, 'HowToUseIcon')
export const ExitToAppIcon = createIcon(LogOut, 'ExitToAppIcon')
export const KeyIcon = createIcon(KeyRound, 'KeyIcon')
export const FavoriteBorderIcon = createIcon(Heart, 'FavoriteBorderIcon')
export const GlobeIcon = createIcon(Globe, 'GlobeIcon')
export const WbSunnyIcon = createIcon(Sun, 'WbSunnyIcon')
export const NightsStayIcon = createIcon(Moon, 'NightsStayIcon')
export const AutoAwesomeIcon = createIcon(Sparkles, 'AutoAwesomeIcon')
