<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $fillable = ['title', 'description'];

    // Add this relationship
    public function chapters()
    {
        return $this->hasMany(Chapter::class);
    }

    public function quiz()
    {
        return $this->hasOne(Quiz::class);
    }
}
