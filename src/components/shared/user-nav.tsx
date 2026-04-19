'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { logout } from '@/lib/actions/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { LogOut, Shield, Briefcase, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function UserNav() {
  const { user } = useAuth();

  if (!user) return null;

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-white/10 hover:ring-white/20 transition-all cursor-pointer outline-none">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-medium leading-none">
                {user.full_name}
              </p>
              <Badge variant="secondary" className="w-fit text-xs gap-1">
                {user.role === 'ADMIN' ? (
                  <Shield className="h-3 w-3" />
                ) : (
                  <Briefcase className="h-3 w-3" />
                )}
                {user.role}
              </Badge>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <Link href={user.role === 'ADMIN' ? '/admin/profile' : '/sales/profile'}>
          <DropdownMenuItem className="cursor-pointer">
            <User className="mr-2 h-4 w-4 text-slate-500" />
            <span>Profil Saya</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Keluar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
