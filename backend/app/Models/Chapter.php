<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Chapter extends Model
{
    protected $fillable = ['course_id', 'title', 'description', 'video_url', 'pdf_url'];
}
