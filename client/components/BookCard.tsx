import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Eye, 
  Calendar, 
  MapPin, 
  Bookmark,
  Download,
  BookText,
  Quote,
  Edit
} from "lucide-react";

interface BookCardProps {
  book: {
    _id: string;
    id?: string; // Some interfaces use id instead of _id
    title: string;
    author: string;
    coverImage?: string;
    description?: string;
    genre: string;
    publishedYear?: number;
    publisher?: string;
    isbn: string;
    availableCopies: number;
    totalCopies: number;
    status?: string;
    location?: string;
    pages?: number;
    hasDownload?: boolean;
    hasReadOnline?: boolean;
    categories?: string[];
  };
  variant?: 'grid' | 'list' | 'compact';
  showActions?: boolean;
  onView?: (book: any) => void;
  onBorrow?: (bookId: string) => void;
  onReserve?: (bookId: string) => void;
  onEdit?: (book: any) => void;
  onSave?: (book: any) => void;
  onCite?: (book: any) => void;
  imageKey?: number;
  canBorrow?: boolean;
  canReserve?: boolean;
  showEditButton?: boolean;
  className?: string;
}

export default function BookCard({
  book,
  variant = 'grid',
  showActions = true,
  onView,
  onBorrow,
  onReserve,
  onEdit,
  onSave,
  onCite,
  imageKey = Date.now(),
  canBorrow = true,
  canReserve = true,
  showEditButton = false,
  className = ""
}: BookCardProps) {
  const bookId = book._id || book.id || '';

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'low-stock': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out-of-stock': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAvailabilityStatus = () => {
    if (book.availableCopies > 0) return 'available';
    return 'out-of-stock';
  };

  const renderCoverImage = () => (
    <div className="w-full h-full relative">
      {book.coverImage ? (
        <img 
          src={`${book.coverImage}?t=${imageKey}`}
          alt={`Cover of ${book.title}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                  <div class="text-center p-4">
                    <svg class="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                    </svg>
                    <p class="text-xs font-medium">No Cover</p>
                  </div>
                </div>
              `;
            }
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
          <div className="text-center p-4">
            <BookText className="w-8 h-8 mx-auto mb-2" />
            <p className="text-xs font-medium">No Cover</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderBookInfo = () => (
    <div className="space-y-2">
      <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-2 group-hover:text-blue-700 transition-colors">
        {book.title}
      </h3>
      <p className="text-sm text-gray-600 font-medium">
        by {book.author}
      </p>
      
      {variant !== 'compact' && (
        <div className="space-y-1">
          {book.description && (
            <p className="text-xs text-gray-500 line-clamp-2">
              {book.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {book.publishedYear && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {book.publishedYear}
              </span>
            )}
            {book.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {book.location}
              </span>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {book.availableCopies} of {book.totalCopies} copies available
          </div>
        </div>
      )}
    </div>
  );

  const renderActions = () => {
    if (!showActions) return null;

    const buttonClass = "h-9 px-4 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95";
    const primaryButtonClass = `${buttonClass} bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg`;
    const secondaryButtonClass = `${buttonClass} bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md`;
    const outlineButtonClass = `${buttonClass} bg-transparent hover:bg-gray-50 text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-400`;

    return (
      <div className={`flex gap-2 ${variant === 'compact' ? 'flex-col' : 'flex-wrap'}`}>
        {onView && (
          <Button
            size="sm"
            onClick={() => onView(book)}
            className={primaryButtonClass}
            title="View full book details"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        )}
        
        {onBorrow && canBorrow && book.availableCopies > 0 && (
          <Button
            size="sm"
            onClick={() => onBorrow(book._id || book.id || '')}
            className={secondaryButtonClass}
            title="Borrow this book"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Borrow
          </Button>
        )}
        
        {onReserve && canReserve && book.availableCopies === 0 && (
          <Button
            size="sm"
            onClick={() => onReserve(book._id || book.id || '')}
            className={outlineButtonClass}
            title="Reserve this book"
          >
            <Bookmark className="w-4 h-4 mr-2" />
            Reserve
          </Button>
        )}
        
        {onSave && (
          <Button
            size="sm"
            onClick={() => onSave(book)}
            className={outlineButtonClass}
            title="Save to your library"
          >
            <Bookmark className="w-4 h-4 mr-2" />
            Save
          </Button>
        )}
        
        {onCite && (
          <Button
            size="sm"
            onClick={() => onCite(book)}
            className={outlineButtonClass}
            title="Copy citation"
          >
            <Quote className="w-4 h-4 mr-2" />
            Cite
          </Button>
        )}
        
        {showEditButton && onEdit && (
          <Button
            size="sm"
            onClick={() => onEdit(book)}
            className={outlineButtonClass}
            title="Edit book details"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
        
        {book.hasDownload && (
          <Button
            size="sm"
            onClick={() => {/* Handle download */}}
            className={outlineButtonClass}
            title="Download book"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        )}
      </div>
    );
  };

  if (variant === 'list') {
    return (
      <Card className={`
        group relative overflow-hidden transition-all duration-300 
        hover:shadow-lg hover:shadow-blue-100 hover:-translate-y-1
        flex book-card-hover ${className} border-gray-100 hover:border-blue-200
      `}>
        <div className="flex-shrink-0 w-28 h-40 relative overflow-hidden bg-white">
          {renderCoverImage()}
        </div>
        
        <CardContent className="flex-1 p-6">
          <div className="flex justify-between items-start h-full">
            <div className="flex-1 mr-6">
              {renderBookInfo()}
            </div>
            
            <div className="flex flex-col gap-3 items-end">
              <Badge className={`${getStatusColor()} text-xs px-3 py-1 font-medium shadow-sm`}>
                {getAvailabilityStatus()}
              </Badge>
              <div className="flex flex-col gap-2">
                {renderActions()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={`
        group relative overflow-hidden transition-all duration-300 
        hover:shadow-lg hover:shadow-blue-100 hover:-translate-y-1
        book-card-hover ${className} border-gray-100 hover:border-blue-200
      `}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-14 h-20 relative overflow-hidden bg-white rounded">
              {renderCoverImage()}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 truncate mb-1">
                {book.title}
              </h3>
              <p className="text-xs text-gray-600 truncate mb-3">
                by {book.author}
              </p>
              
              <div className="flex items-center justify-between gap-2">
                <Badge className={`${getStatusColor()} text-xs px-2 py-1`}>
                  {getAvailabilityStatus()}
                </Badge>
                
                <div className="flex gap-1">
                  {onView && (
                    <Button
                      size="sm"
                      onClick={() => onView(book)}
                      className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                      title="View full book details"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid variant (default) - Clean cover images, no background
  return (
    <Card className={`
      group relative overflow-hidden transition-all duration-300 
      hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-2
      book-card-hover ${className} border-gray-100 hover:border-blue-200
    `}>
      <div className="relative">
        {/* Cover Image - Clean, full-size display */}
        <div className="relative overflow-hidden aspect-[3/4] bg-white">
          {renderCoverImage()}
          
          {/* Only status badge on cover */}
          <div className="absolute top-3 right-3">
            <Badge className={`${getStatusColor()} text-xs font-medium shadow-lg backdrop-blur-sm bg-white/90`}>
              {getAvailabilityStatus()}
            </Badge>
          </div>
          
          {/* Subtle hover effect on image only */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <CardContent className="p-4">
          {renderBookInfo()}
          
          {/* Action buttons below content - always visible, better styled */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-2 justify-center">
              {renderActions()}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
} 